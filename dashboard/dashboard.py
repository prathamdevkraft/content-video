import streamlit as st
from supabase import create_client
import os

# --- Configuration ---
# In a real setup, these come from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL", "YOUR_SUPABASE_URL_HERE")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "YOUR_SUPABASE_KEY_HERE")
VIDEO_QUEUE_TABLE = "content_queue"
AUDIT_TABLE = "audit_logs"

def init_connection():
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        st.error(f"Failed to connect to Supabase: {e}")
        return None

supabase = init_connection()

st.set_page_config(layout="wide", page_title="Taxfix Content Cockpit")

st.title("🛡️ Taxfix Compliance Review Queue")
st.markdown("Review AI-generated content before it goes live. Ensure strict adherence to **BaFin** and **FCA** guidelines.")

if not supabase:
    st.warning("Please configure Supabase credentials in docker-compose.yml")
    st.stop()

# --- Fetch Logic ---
try:
    response = supabase.table(VIDEO_QUEUE_TABLE).select("*").eq('status', 'PENDING_REVIEW').execute()
    pending_videos = response.data
except Exception as e:
    st.error(f"Error fetching data: {e}")
    pending_videos = []

if not pending_videos:
    st.success("No videos pending review! All clear. 🎉")

# --- UI Loop ---
for video in pending_videos:
    with st.container():
        st.markdown("---")
        col1, col2, col3 = st.columns([1, 1.5, 1])
        
        # Column 1: Asset Preview
        with col1:
            st.subheader("Asset Preview")
            # In a real app, video_url would point to Supabase Storage signed URL
            if 'video_url' in video and video['video_url']:
                st.video(video['video_url'])
            else:
                st.info("Video rendering...")
        
        # Column 2: Compliance Data (Chain of Verification)
        with col2:
            st.subheader("📝 Script & citations")
            st.markdown(f"**Topic:** {video.get('topic', 'Unknown')}")
            
            with st.expander("Show Script", expanded=True):
                st.text(video.get('script_text', 'No script text found.'))
            
            st.markdown("### ⚖️ Chain of Verification")
            if 'citations' in video and video['citations']:
                st.success(f"Verified against: {video['citations']}")
            else:
                st.warning("⚠️ No specific legal citation found.")
                
        # Column 3: Decision
        with col3:
            st.subheader("Decision")
            st.info(f"Target: {video.get('platform', 'TikTok')} (DE)")
            
            if st.button("✅ APPROVE & PUBLISH", key=f"app_{video['id']}"):
                # 1. Update Status
                supabase.table(VIDEO_QUEUE_TABLE).update({'status': 'APPROVED'}).eq('id', video['id']).execute()
                # 2. Log Audit
                supabase.table(AUDIT_TABLE).insert({
                    'asset_id': video['id'],
                    'old_status': 'PENDING_REVIEW',
                    'new_status': 'APPROVED',
                    'changed_by': 'Human_Reviewer_1' # Replace with actual Auth user
                }).execute()
                # 3. Trigger n8n Webhook (Optional, usually handled by Supabase Webhook or Polling)
                st.balloons()
                st.rerun()
                
            if st.button("❌ REJECT", key=f"rej_{video['id']}"):
                reason = st.text_input("Rejection Reason", key=f"reason_{video['id']}")
                if reason:
                    supabase.table(VIDEO_QUEUE_TABLE).update({'status': 'REJECTED', 'feedback': reason}).eq('id', video['id']).execute()
                    supabase.table(AUDIT_TABLE).insert({
                        'asset_id': video['id'],
                        'old_status': 'PENDING_REVIEW',
                        'new_status': 'REJECTED',
                        'note': reason,
                        'changed_by': 'Human_Reviewer_1'
                    }).execute()
                    st.toast("Video Rejected")
                    st.rerun()

st.markdown("---")
st.caption("Powered by n8n, Editly, and Supabase.")
