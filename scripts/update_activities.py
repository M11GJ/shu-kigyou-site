import json
import os
import sys

ACTIVITY_HTML_PATH = 'activity.html'
MEMBERS_JSON_PATH = 'data/members.json'
ACTIVITIES_JSON_PATH = 'data/activities.json'
MAX_AVATARS = 15 # 表示する最大人数

def generate_activity_html(activities, members):
    # データの整合性チェック
    if not isinstance(activities, list):
        print(f"Error: Expected list of activities, but got {type(activities)}. Skipping update.")
        return None
    
    html_parts = []
    for i, act in enumerate(activities):
        date_str = str(act.get('date', ''))
        # 【ガード】不適切なデータをスキップ
        if date_str.startswith('member') or '@' in str(act.get('title', '')):
            print(f"Skipping invalid activity data: {date_str}")
            continue
            
        date = date_str.replace('.', '/')
        title = act.get('title', '')
        content = act.get('content', '')
        link = act.get('link', '')
        tagged_ids = act.get('taggedIds', [])
        
        # 寄稿者のアバターHTML生成
        contributors_html = ""
        if tagged_ids:
            avatar_items = []
            display_count = 0
            
            for m_id in tagged_ids:
                if not m_id: continue
                if display_count >= MAX_AVATARS:
                    break
                
                if m_id in members:
                    m = members[m_id]
                    name = m.get('name', '')
                    initial = m.get('initial', '')
                    avatar_url = m.get('avatar', '')
                    display_setting = m.get('displaySetting', 'イニシャル')
                    
                    if display_setting == '名前' and avatar_url:
                        img_html = f'<img src="{avatar_url}" alt="{name}" title="{name}">'
                    else:
                        img_html = f'<span class="tag-icon" title="{name}">{initial}</span>'
                    
                    avatar_items.append(f'<div class="contributor-avatar">{img_html}</div>')
                    display_count += 1
            
            if len(tagged_ids) > MAX_AVATARS:
                plus_count = len(tagged_ids) - MAX_AVATARS
                avatar_items.append(f'<div class="plus-counter">+{plus_count}</div>')
            
            if avatar_items:
                contributors_html = f"""
                <div class="activity-contributors">
                    <span class="contributors-label">Activity By</span>
                    <div class="avatar-list">
                        {"".join(avatar_items)}
                    </div>
                </div>"""

        # ビューモアリンク生成
        view_more_btn = f'<a href="{link}" class="view-more-link" target="_blank" rel="noopener">View More →</a>' if link else ""
        
        item_html = f"""
        <div class="activity-item" id="activity-{i}">
            <div class="activity-left">
                <span class="activity-date">{date}</span>
                {contributors_html}
            </div>
            <div class="activity-content">
                <h4>{title}</h4>
                <p>{content}</p>
                {view_more_btn}
            </div>
        </div>"""
        html_parts.append(item_html)
    
    return "\n".join(html_parts)

def update_activity_page():
    if not os.path.exists(ACTIVITIES_JSON_PATH):
        print("Error: activities.json not found.")
        return
    
    # メンバー情報の読み込み
    members = {}
    if os.path.exists(MEMBERS_JSON_PATH):
        with open(MEMBERS_JSON_PATH, 'r', encoding='utf-8') as f:
            members = json.load(f)
    
    # 活動実績の読み込み
    with open(ACTIVITIES_JSON_PATH, 'r', encoding='utf-8') as f:
        try:
            activities = json.load(f)
        except json.JSONDecodeError:
            print("Error: activities.json is not valid JSON. (Probably received HTML error page)")
            return

    new_content = generate_activity_html(activities, members)
    if new_content is None: return

    with open(ACTIVITY_HTML_PATH, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    with open(ACTIVITY_HTML_PATH, 'w', encoding='utf-8') as f:
        skip = False
        for line in lines:
            if '<!-- ACTIVITIES_START -->' in line:
                f.write(line)
                f.write(new_content + "\n")
                skip = True
            elif '<!-- ACTIVITIES_END -->' in line:
                f.write(line)
                skip = False
            elif not skip:
                f.write(line)
    
    print(f"Successfully updated {ACTIVITY_HTML_PATH} with anchors (id='activity-N')")

if __name__ == "__main__":
    update_activity_page()
