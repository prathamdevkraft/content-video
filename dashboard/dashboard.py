"""
Taxfix Content Cockpit v3.0 - Enhanced Compliance Dashboard
Purpose: Human-in-the-loop review interface for AI-generated tax content
Features: 3-Tab Interface (Asset, Intelligence, Audit Trail)
Author: Taxfix Engineering Team
"""

import streamlit as st
from supabase import create_client, Client
import os
from datetime import datetime
import json
from pathlib import Path
from typing import Optional, Dict, List

# ============================================================================
# CONFIGURATION
# ============================================================================

st.set_page_config(
    page_title="Taxfix Content Cockpit v3.0",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
VIDEO_QUEUE_TABLE = os.getenv("VIDEO_QUEUE_TABLE", "content_queue")
AUDIT_TABLE = os.getenv("AUDIT_TABLE", "audit_logs")
VIDEO_STORAGE_PATH = Path("/data/files")
DEFAULT_USER = os.getenv("DEFAULT_USER", "Compliance_Officer_1")

# ============================================================================
# CUSTOM CSS
# ============================================================================

st.markdown("""
<style>
    .metric-card {
        background-color: #f0f2f6;
        padding: 20px;
        border-radius: 10px;
        border-left: 5px solid #1f77b4;
    }
    .success-badge {
        background-color: #d4edda;
        color: #155724;
        padding: 5px 10px;
        border-radius: 5px;
        font-weight: bold;
    }
    .warning-badge {
        background-color: #fff3cd;
        color: #856404;
        padding: 5px 10px;
        border-radius: 5px;
        font-weight: bold;
    }
    .error-badge {
        background-color: #f8d7da;
        color: #721c24;
        padding: 5px 10px;
        border-radius: 5px;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

# ============================================================================
# SUPABASE CLIENT
# ============================================================================

@st.cache_resource
def init_supabase() -> Optional[Client]:
    """Initialize Supabase client with error handling"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        st.error("⚠️ Missing Supabase credentials in environment variables")
        st.info("Please check your `.env` file and ensure SUPABASE_URL and SUPABASE_KEY are set")
        return None
    
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        st.error(f"❌ Failed to connect to Supabase: {e}")
        return None

supabase = init_supabase()

# ============================================================================
# SESSION STATE
# ============================================================================

if 'user_name' not in st.session_state:
    st.session_state.user_name = DEFAULT_USER

if 'last_refresh' not in st.session_state:
    st.session_state.last_refresh = datetime.now()

if 'selected_video_id' not in st.session_state:
    st.session_state.selected_video_id = None

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_dashboard_metrics() -> Dict:
    """Fetch KPIs for dashboard header"""
    if not supabase:
        return {'pending': 0, 'approved': 0, 'errors': 0, 'avg_compliance': 0.00}
    
    try:
        # Count by status using simple queries
        pending = supabase.table(VIDEO_QUEUE_TABLE)\
            .select('id', count='exact')\
            .eq('status', 'PENDING_REVIEW')\
            .execute()
        
        approved = supabase.table(VIDEO_QUEUE_TABLE)\
            .select('id', count='exact')\
            .eq('status', 'APPROVED')\
            .execute()
        
        errors = supabase.table(VIDEO_QUEUE_TABLE)\
            .select('id', count='exact')\
            .eq('status', 'ERROR')\
            .execute()
        
        # Try to get average compliance score (will fail gracefully if function doesn't exist)
        try:
            avg_score_result = supabase.rpc('avg_compliance_score').execute()
            avg_score = float(avg_score_result.data) if avg_score_result.data else 0.00
        except:
            # Fallback: Calculate manually
            all_records = supabase.table(VIDEO_QUEUE_TABLE)\
                .select('compliance_score')\
                .not_.is_('compliance_score', 'null')\
                .execute()
            
            if all_records.data:
                scores = [r['compliance_score'] for r in all_records.data if r.get('compliance_score')]
                avg_score = sum(scores) / len(scores) if scores else 0.00
            else:
                avg_score = 0.00
        
        return {
            'pending': pending.count or 0,
            'approved': approved.count or 0,
            'errors': errors.count or 0,
            'avg_compliance': avg_score
        }
    
    except Exception as e:
        st.error(f"Failed to fetch metrics: {e}")
        return {'pending': 0, 'approved': 0, 'errors': 0, 'avg_compliance': 0.00}

def get_videos(status_filter: str = "PENDING_REVIEW", platform_filter: str = "ALL") -> List[Dict]:
    """Fetch videos from database with filters"""
    if not supabase:
        return []
    
    try:
        query = supabase.table(VIDEO_QUEUE_TABLE).select('*')
        
        # Apply status filter
        if status_filter != "ALL":
            query = query.eq('status', status_filter)
        
        # Apply platform filter
        if platform_filter != "ALL":
            query = query.eq('platform', platform_filter)
        
        response = query.order('created_at', desc=True).limit(50).execute()
        return response.data or []
    
    except Exception as e:
        st.error(f"Failed to fetch videos: {e}")
        return []

def update_video_status(
    video_id: str,
    new_status: str,
    notes: Optional[str] = None
) -> bool:
    """Update video status and create audit log"""
    if not supabase:
        return False
    
    try:
        # 1. Get current status for audit log
        current = supabase.table(VIDEO_QUEUE_TABLE)\
            .select('status')\
            .eq('id', video_id)\
            .execute()
        
        old_status = current.data[0]['status'] if current.data else 'UNKNOWN'
        
        # 2. Update content_queue
        update_data = {
            'status': new_status,
            'reviewed_by': st.session_state.user_name,
            'reviewed_at': datetime.utcnow().isoformat()
        }
        
        if notes:
            update_data['review_notes'] = notes
        
        supabase.table(VIDEO_QUEUE_TABLE)\
            .update(update_data)\
            .eq('id', video_id)\
            .execute()
        
        # 3. Create audit log
        supabase.table(AUDIT_TABLE).insert({
            'asset_id': video_id,
            'old_status': old_status,
            'new_status': new_status,
            'changed_by': st.session_state.user_name,
            'note': notes or f'Status changed from {old_status} to {new_status}',
            'timestamp': datetime.utcnow().isoformat()
        }).execute()
        
        return True
    
    except Exception as e:
        st.error(f"Failed to update status: {e}")
        return False

def format_timestamp(timestamp: Optional[str]) -> str:
    """Format ISO timestamp to readable string"""
    if not timestamp:
        return "N/A"
    try:
        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        return dt.strftime("%Y-%m-%d %H:%M UTC")
    except:
        return str(timestamp)

def get_video_file_path(row: Dict) -> Optional[Path]:
    """Get the actual video file path from database record"""
    # Priority: video_path (new field) > video_url (legacy field)
    path_str = row.get('video_path') or row.get('video_url')
    
    if not path_str:
        return None
    
    # Handle both absolute and relative paths
    if path_str.startswith('/data/files/'):
        return Path(path_str)
    elif path_str.startswith('/'):
        return Path(path_str)
    else:
        # Relative path - prepend storage directory
        return VIDEO_STORAGE_PATH / Path(path_str).name

def get_compliance_badge(score: Optional[float]) -> str:
    """Get HTML badge for compliance score"""
    if score is None:
        return '<span class="warning-badge">⏳ Pending</span>'
    elif score >= 0.80:
        return '<span class="success-badge">✅ High Compliance</span>'
    elif score >= 0.60:
        return '<span class="warning-badge">⚠️ Medium Compliance</span>'
    else:
        return '<span class="error-badge">❌ Low Compliance</span>'

# ============================================================================
# MAIN UI - HEADER
# ============================================================================

st.title("🛡️ Taxfix Content Cockpit v3.0")
st.markdown(
    f"**Compliance Officer:** `{st.session_state.user_name}` | "
    f"**Last Refresh:** {st.session_state.last_refresh.strftime('%H:%M:%S')}"
)

if not supabase:
    st.warning("⚠️ Supabase connection failed. Please check your configuration.")
    st.stop()

# ============================================================================
# METRICS ROW
# ============================================================================

st.markdown("### 📊 System Overview")

metrics = get_dashboard_metrics()

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric(
        label="⏳ Pending Review",
        value=metrics['pending'],
        help="Videos awaiting human approval"
    )

with col2:
    st.metric(
        label="✅ Approved",
        value=metrics['approved'],
        help="Videos approved and ready to publish"
    )

with col3:
    st.metric(
        label="❌ Generation Errors",
        value=metrics['errors'],
        help="Videos that failed during generation"
    )

with col4:
    compliance_score = metrics['avg_compliance']
    delta_label = "High" if compliance_score >= 0.80 else ("Medium" if compliance_score >= 0.60 else "Low")
    st.metric(
        label="📊 Avg Compliance",
        value=f"{compliance_score:.2f}",
        delta=delta_label,
        delta_color="normal" if compliance_score >= 0.80 else "inverse",
        help="Average RAG compliance score across all reviewed content"
    )

st.markdown("---")

# ============================================================================
# FILTERS & CONTROLS
# ============================================================================

col_filter1, col_filter2, col_refresh = st.columns([2, 2, 1])

with col_filter1:
    status_filter = st.selectbox(
        "📊 Filter by Status:",
        ["PENDING_REVIEW", "ALL", "APPROVED", "REJECTED", "PUBLISHED", "ERROR"],
        index=0,
        help="Filter content by review status"
    )

with col_filter2:
    platform_filter = st.selectbox(
        "📱 Filter by Platform:",
        ["ALL", "TikTok", "Instagram", "YouTube"],
        index=0,
        help="Filter content by target platform"
    )

with col_refresh:
    if st.button("🔄 Refresh Data", use_container_width=True):
        st.session_state.last_refresh = datetime.now()
        st.cache_data.clear()
        st.rerun()

# ============================================================================
# VIDEO SELECTOR
# ============================================================================

videos = get_videos(status_filter, platform_filter)

if not videos:
    st.info(f"📭 No videos found for **Status: {status_filter}** | **Platform: {platform_filter}**")
    st.stop()

# Video dropdown with enhanced formatting
video_options = []
for v in videos:
    topic = v.get('topic', 'Untitled')[:60]
    status = v.get('status', 'UNKNOWN')
    platform = v.get('platform', 'N/A')
    created = format_timestamp(v.get('created_at'))
    
    video_options.append(f"{topic}... | {status} | {platform} | {created}")

selected_idx = st.selectbox(
    f"🎥 Select Video to Review ({len(videos)} found):",
    range(len(videos)),
    format_func=lambda i: video_options[i],
    key="video_selector"
)

row = videos[selected_idx]
st.session_state.selected_video_id = row['id']

# ============================================================================
# TABBED INTERFACE
# ============================================================================

tab1, tab2, tab3 = st.tabs(["📹 Asset Preview", "🧠 Intelligence & Compliance", "📋 Audit Trail"])

# ============================================================================
# TAB 1: ASSET PREVIEW
# ============================================================================
with tab1:
    st.subheader("🎥 Generated Video Asset")
    
    col_video, col_social = st.columns([2, 1])
    
    with col_video:
        st.markdown("#### Video Preview")
        
        # Video player
        video_path = get_video_file_path(row)
        
        if video_path and video_path.exists():
            st.video(str(video_path))
            st.caption(f"📂 **File:** `{video_path.name}`")
            st.caption(f"📏 **Size:** {video_path.stat().st_size / 1024 / 1024:.2f} MB")
        else:
            st.warning("⚠️ **Video file not found**")
            st.info(
                "**Possible reasons:**\n\n"
                "- Video is still being generated by n8n workflow\n"
                "- File path mismatch between database and filesystem\n"
                "- File was deleted or moved\n\n"
                f"**Expected path:** `{video_path}`"
            )
            
            # Debug info for troubleshooting
            with st.expander("🔍 Debug Information"):
                st.json({
                    'database_video_path': row.get('video_path'),
                    'database_video_url': row.get('video_url'),
                    'resolved_file_path': str(video_path) if video_path else None,
                    'file_exists': video_path.exists() if video_path else False,
                    'storage_directory': str(VIDEO_STORAGE_PATH),
                    'files_in_storage': [f.name for f in VIDEO_STORAGE_PATH.glob('*')] if VIDEO_STORAGE_PATH.exists() else []
                })
    
    with col_social:
        st.markdown("#### 📱 Social Media Preview")
        
        # Platform badge
        platform = row.get('platform', 'Unknown')
        st.info(f"**Target Platform:** {platform}")
        
        # Social metrics
        social_metrics = row.get('social_metrics', {})
        
        if social_metrics:
            caption = social_metrics.get('caption', 'No caption generated')
            hashtags = social_metrics.get('hashtags', [])
            
            st.markdown("**Caption:**")
            st.text_area(
                label="caption_display",
                value=caption,
                height=150,
                disabled=True,
                label_visibility="collapsed",
                help="Auto-generated social media caption"
            )
            
            if hashtags:
                st.markdown("**Hashtags:**")
                hashtag_str = " ".join(f"`{tag}`" for tag in hashtags)
                st.markdown(hashtag_str)
        else:
            st.caption("_Social metadata not generated yet_")
        
        # Display topic and creation date
        st.markdown("---")
        st.markdown(f"**Topic:** {row.get('topic', 'N/A')}")
        st.markdown(f"**Created:** {format_timestamp(row.get('created_at'))}")
    
    # ========================================================================
    # ACTION BUTTONS (Only for PENDING_REVIEW status)
    # ========================================================================
    if row['status'] == 'PENDING_REVIEW':
        st.markdown("---")
        st.markdown("### ⚡ Review Actions")
        
        col_approve, col_reject = st.columns([1, 1])
        
        with col_approve:
            st.markdown("#### ✅ Approve Content")
            st.caption("Mark this content as approved and queue for publishing")
            
            if st.button(
                "APPROVE & QUEUE FOR PUBLISHING",
                type="primary",
                use_container_width=True,
                key="approve_btn"
            ):
                if update_video_status(row['id'], 'APPROVED'):
                    st.success("✅ **Video approved!** Added to publishing queue.")
                    st.balloons()
                    # Wait a moment before rerun to show success message
                    import time
                    time.sleep(1)
                    st.rerun()
        
        with col_reject:
            st.markdown("#### ❌ Reject Content")
            st.caption("Archive this content with a rejection reason")
            
            with st.expander("🔻 Click to Reject"):
                rejection_reason = st.text_area(
                    "**Rejection Reason (Required):**",
                    placeholder="Examples:\n- Contains unverified tax claim\n- Missing legal citation\n- Tone not appropriate for fintech\n- Factual error in script",
                    height=100,
                    help="Provide a clear reason for rejection to improve future content generation"
                )
                
                if st.button("⚠️ Confirm Rejection", type="secondary", key="reject_btn"):
                    if not rejection_reason or len(rejection_reason.strip()) < 10:
                        st.error("❌ Please provide a detailed rejection reason (minimum 10 characters)")
                    else:
                        if update_video_status(row['id'], 'REJECTED', rejection_reason):
                            st.warning("Content rejected and archived.")
                            import time
                            time.sleep(1)
                            st.rerun()
    
    elif row['status'] == 'APPROVED':
        st.success("✅ This content has been approved and is queued for publishing.")
    
    elif row['status'] == 'PUBLISHED':
        st.success("🚀 This content has been published!")
        if row.get('published_url'):
            st.markdown(f"**Live URL:** [{row['published_url']}]({row['published_url']})")
    
    elif row['status'] == 'REJECTED':
        st.error("❌ This content was rejected.")
        if row.get('review_notes'):
            st.markdown(f"**Reason:** {row['review_notes']}")
    
    elif row['status'] == 'ERROR':
        st.error("❌ This content failed during generation.")
        if row.get('error_log'):
            with st.expander("📋 View Error Log"):
                st.code(row['error_log'], language='text')

# ============================================================================
# TAB 2: INTELLIGENCE & COMPLIANCE
# ============================================================================
with tab2:
    st.subheader("🧠 Content Intelligence & Compliance Analysis")
    
    col_scores, col_source = st.columns([1, 1])
    
    with col_scores:
        st.markdown("### 📊 Compliance Score")
        
        compliance = row.get('compliance_score')
        
        if compliance is not None:
            # Visual progress bar
            st.progress(compliance, text=f"Score: {compliance:.2f}")
            
            # Badge
            st.markdown(get_compliance_badge(compliance), unsafe_allow_html=True)
            
            # Explanation
            if compliance >= 0.80:
                st.success(
                    "**High Compliance (0.80-1.00)**\n\n"
                    "This content has been verified against tax regulations "
                    "with high confidence. Safe to approve."
                )
            elif compliance >= 0.60:
                st.warning(
                    "**Medium Compliance (0.60-0.79)**\n\n"
                    "Review carefully. Some aspects may need verification "
                    "against original sources."
                )
            else:
                st.error(
                    "**Low Compliance (< 0.60)**\n\n"
                    "⚠️ Do NOT approve without thorough manual review. "
                    "Content may contain unverified claims or errors."
                )
        else:
            st.info("⏳ **Compliance check pending**\n\nThis feature will be enabled in Phase 3 (RAG integration)")
    
    with col_source:
        st.markdown("### 📰 Source Material")
        
        source_url = row.get('source_url')
        
        if source_url:
            st.markdown(f"**Origin:** [{source_url}]({source_url})")
            st.caption("Click to view the original tax policy/news article")
        else:
            st.info("No source URL recorded for this content")
        
        # Citations
        st.markdown("---")
        st.markdown("### ⚖️ Legal Citations")
        
        citations = row.get('citations')
        if citations:
            st.success(f"**Verified against:** {citations}")
        else:
            st.warning("⚠️ No specific legal citation found")
    
    # Validation details
    st.markdown("---")
    st.markdown("### ✅ Validation Results")
    
    validations = row.get('validations', {})
    
    if validations:
        checks = validations.get('checks', [])
        
        if checks:
            st.markdown("**Automated Checks Passed:**")
            for check in checks:
                st.markdown(f"- ✓ {check}")
        
        rag_notes = validations.get('rag_notes')
        if rag_notes:
            st.info(f"**RAG Analysis:** {rag_notes}")
    else:
        st.info("Validation data will be available in Phase 3 (RAG integration)")
    
    # Script breakdown
    st.markdown("---")
    st.markdown("### 📝 Script Structure Analysis")
    
    script_structure = row.get('script_structure', {})
    script_text = row.get('script_text')  # Legacy field
    
    if script_structure:
        col_hook, col_body, col_cta = st.tabs(["🎯 Hook", "📚 Body", "📢 Call-to-Action"])
        
        with col_hook:
            st.markdown("**Purpose:** Grab attention in first 3 seconds")
            st.info(script_structure.get('hook', '_Not generated_'))
        
        with col_body:
            st.markdown("**Purpose:** Deliver value and education")
            st.info(script_structure.get('body', '_Not generated_'))
        
        with col_cta:
            st.markdown("**Purpose:** Drive action (link click, follow, etc.)")
            st.info(script_structure.get('cta', '_Not generated_'))
    
    elif script_text:
        # Fallback to legacy script_text field
        st.markdown("**Full Script (Legacy Format):**")
        st.text_area(
            label="script_display",
            value=script_text,
            height=200,
            disabled=True,
            label_visibility="collapsed"
        )
    else:
        st.warning("No script data available")

# ============================================================================
# TAB 3: AUDIT TRAIL
# ============================================================================
with tab3:
    st.subheader("📋 Audit Trail & History")
    
    # Fetch audit logs for this video
    if supabase:
        try:
            audit_response = supabase.table(AUDIT_TABLE)\
                .select('*')\
                .eq('asset_id', row['id'])\
                .order('timestamp', desc=True)\
                .execute()
            
            audit_logs = audit_response.data or []
        except Exception as e:
            st.error(f"Failed to fetch audit logs: {e}")
            audit_logs = []
    else:
        audit_logs = []
    
    # Build timeline
    timeline_events = []
    
    # Event 1: Creation
    if row.get('created_at'):
        timeline_events.append({
            'icon': '🆕',
            'event': 'Content Created',
            'timestamp': row['created_at'],
            'details': f"Topic: {row.get('topic', 'N/A')}\nPlatform: {row.get('platform', 'N/A')}",
            'actor': 'AI_System'
        })
    
    # Event 2: Review (if happened)
    if row.get('reviewed_at'):
        timeline_events.append({
            'icon': '👤',
            'event': 'Human Review',
            'timestamp': row['reviewed_at'],
            'details': f"Status changed to: {row.get('status', 'N/A')}",
            'actor': row.get('reviewed_by', 'Unknown')
        })
    
    # Event 3: Publishing (if happened)
    if row.get('status') == 'PUBLISHED' and row.get('updated_at'):
        timeline_events.append({
            'icon': '🚀',
            'event': 'Published',
            'timestamp': row['updated_at'],
            'details': f"Published to {row.get('platform', 'N/A')}",
            'actor': 'Publishing_System'
        })
    
    # Render timeline
    st.markdown("### 📅 Timeline")
    
    for event in timeline_events:
        col_icon, col_content = st.columns([1, 10])
        
        with col_icon:
            st.markdown(f"## {event['icon']}")
        
        with col_content:
            st.markdown(f"**{event['event']}**")
            st.caption(f"🕒 {format_timestamp(event['timestamp'])} | 👤 {event['actor']}")
            st.markdown(event['details'])
        
        st.markdown("---")
    
    # Audit logs table
    if audit_logs:
        st.markdown("### 📊 Detailed Audit Log")
        
        import pandas as pd
        
        df_audit = pd.DataFrame(audit_logs)
        df_audit['timestamp'] = df_audit['timestamp'].apply(format_timestamp)
        
        # Select relevant columns
        display_columns = ['timestamp', 'old_status', 'new_status', 'changed_by', 'note']
        available_columns = [col for col in display_columns if col in df_audit.columns]
        
        st.dataframe(
            df_audit[available_columns],
            use_container_width=True,
            hide_index=True
        )
    else:
        st.info("No audit log entries found for this video")
    
    # Error log (if exists)
    if row.get('error_log'):
        st.markdown("---")
        st.error("### ❌ Error Log")
        st.code(row['error_log'], language='text')
        st.caption(f"**Retry attempts:** {row.get('retry_count', 0)}/3")
        
        if row.get('retry_count', 0) >= 3:
            st.warning("⚠️ Maximum retry limit reached. Manual intervention required.")
    
    # Review notes (if exists)
    if row.get('review_notes'):
        st.markdown("---")
        st.info("### 📝 Review Notes")
        st.markdown(row['review_notes'])
    
    # Raw database record (for debugging)
    with st.expander("🔍 Raw Database Record (Debug)"):
        st.json(row)

# ============================================================================
# SIDEBAR: SYSTEM STATUS & HELP
# ============================================================================

with st.sidebar:
    st.header("⚙️ System Status")
    
    # File system check
    st.subheader("📁 Storage Health")
    
    try:
        if VIDEO_STORAGE_PATH.exists():
            files = list(VIDEO_STORAGE_PATH.glob("*"))
            video_files = [f for f in files if f.suffix in ['.mp4', '.mov', '.avi']]
            audio_files = [f for f in files if f.suffix in ['.mp3', '.wav']]
            
            st.metric("Total Files", len(files))
            st.metric("Video Files", len(video_files))
            st.metric("Audio Files", len(audio_files))
            
            with st.expander("📂 View Files"):
                for f in files[:15]:  # Show first 15 files
                    file_size = f.stat().st_size / 1024  # KB
                    st.text(f"{f.name} ({file_size:.1f} KB)")
                
                if len(files) > 15:
                    st.caption(f"...and {len(files) - 15} more files")
        else:
            st.error(f"❌ Storage directory not found: {VIDEO_STORAGE_PATH}")
    
    except Exception as e:
        st.error(f"❌ Storage check failed: {e}")
    
    # Database connection check
    st.markdown("---")
    st.subheader("🗄️ Database")
    
    if supabase:
        try:
            test = supabase.table(VIDEO_QUEUE_TABLE).select('id', count='exact').limit(1).execute()
            st.success(f"✅ Connected")
            st.caption(f"Total records: {test.count or 'Unknown'}")
        except Exception as e:
            st.error(f"❌ Connection failed: {e}")
    else:
        st.error("❌ Not connected")
    
    # Quick actions
    st.markdown("---")
    st.subheader("⚡ Quick Actions")
    
    if st.button("🔄 Refresh All Data", use_container_width=True):
        st.cache_data.clear()
        st.session_state.last_refresh = datetime.now()
        st.rerun()
    
    if st.button("📊 View Analytics", use_container_width=True):
        st.info("Analytics dashboard coming in Phase 4")
    
    # Help section
    st.markdown("---")
    st.subheader("❓ Help & Docs")
    
    with st.expander("📖 Review Guidelines"):
        st.markdown("""
        **What to check before approving:**
        
        1. **Legal Accuracy:** Verify citations match source
        2. **Brand Tone:** Ensure language aligns with Taxfix voice
        3. **No Financial Advice:** Check for prohibited language
        4. **Platform Fit:** Confirm format suits target platform
        5. **Compliance Score:** Should be ≥ 0.80 for auto-approve
        """)
    
    with st.expander("🚨 Escalation Process"):
        st.markdown("""
        **When to escalate:**
        
        - Compliance score < 0.60
        - Missing legal citations
        - Unclear source material
        - Content makes specific financial predictions
        
        **Contact:** compliance@taxfix.de
        """)
    
    st.markdown("---")
    st.caption("Taxfix Content Orchestrator v3.0")
    st.caption("Powered by n8n, Editly, and Supabase")
    st.caption(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
