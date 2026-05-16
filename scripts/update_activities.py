import json
import os
import re

# 設定
ACTIVITY_HTML_PATH = 'activity.html'
MEMBERS_JSON_PATH = 'data/members.json'
ACTIVITIES_JSON_PATH = 'data/activities.json'
MAX_AVATARS = 8 # 表示する最大人数

def generate_activity_html(activities, members):
    html_parts = []
    for i, act in enumerate(activities): # インデックスを追加
        date = act.get('date', '').replace('.', '/')
        title = act.get('title', '')
        content = act.get('content', '')
        link = act.get('link', '')
        tagged_ids = act.get('taggedIds', [])
        
        # アンカー用のID
        activity_id = f"activity-{i}"
        
        # ラベル付きアバターリストの生成
        tags_html = ""
        if tagged_ids:
            tags_html = '<div class="activity-contributors">'
            tags_html += '<span class="contributors-label">Activity by</span>'
            tags_html += '<div class="avatar-list">'
            
            display_ids = tagged_ids[:MAX_AVATARS]
            remaining = len(tagged_ids) - MAX_AVATARS
            
            for mid in display_ids:
                member = members.get(mid, {})
                name = member.get('name') or member.get('initial') or mid
                avatar = member.get('avatar', '')
                
                if avatar:
                    tag_img = f'<img src="{avatar}" alt="{name}">'
                else:
                    initial = member.get('initial', name[0] if name else '?')
                    tag_img = f'<span class="tag-icon">{initial[0]}</span>'
                
                tags_html += f"""
                    <a href="members.html?id={mid}" class="contributor-avatar" title="{name}">
                        {tag_img}
                    </a>"""
            
            if remaining > 0:
                tags_html += f'<span class="contributor-avatar plus-counter">+{remaining}</span>'
                
            tags_html += '</div></div>'
        
        # View More リンク
        view_more_html = f'<a href="{link}" target="_blank" class="view-more-link">View More</a>' if link else ""
        
        item_html = f"""
<div class="activity-item" id="{activity_id}">
    <div class="activity-left-col">
        <div class="activity-header-mobile">
            <span class="activity-date">{date}</span>
            <div class="view-more-mobile">{view_more_html}</div>
        </div>
        <div class="tags-for-pc">{tags_html}</div>
    </div>
    <div class="activity-content">
        <h4>{title}</h4>
        <p>{content}</p>
        <div class="tags-for-mobile">{tags_html}</div>
        <div class="view-more-for-pc">{view_more_html}</div>
    </div>
</div>"""
        html_parts.append(item_html)
    
    return "\n".join(html_parts)

def update_activity_page():
    if not os.path.exists(ACTIVITIES_JSON_PATH):
        print("Activities JSON not found.")
        return

    with open(ACTIVITIES_JSON_PATH, 'r', encoding='utf-8') as f:
        activities = json.load(f)
    
    members = {}
    if os.path.exists(MEMBERS_JSON_PATH):
        with open(MEMBERS_JSON_PATH, 'r', encoding='utf-8') as f:
            members = json.load(f)
            
    # HTML生成
    new_content = generate_activity_html(activities, members)
    
    # ファイル読み込み
    with open(ACTIVITY_HTML_PATH, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # 置換
    pattern = re.compile(r'<!-- ACTIVITIES_START -->.*?<!-- ACTIVITIES_END -->', re.DOTALL)
    replacement = f'<!-- ACTIVITIES_START -->{new_content}\n                <!-- ACTIVITIES_END -->'
    
    updated_html = pattern.sub(replacement, html)
    
    # 保存
    with open(ACTIVITY_HTML_PATH, 'w', encoding='utf-8') as f:
        f.write(updated_html)
    print("Successfully updated activity.html with anchors (id='activity-N')")

if __name__ == "__main__":
    update_activity_page()
