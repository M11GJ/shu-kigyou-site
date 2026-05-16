import json
import os
import datetime

ACTIVITY_HTML_PATH = 'activity.html'
MEMBERS_JSON_PATH = 'data/members.json'
ACTIVITIES_JSON_PATH = 'data/activities.json'
MAX_AVATARS = 15

def generate_activity_html(activities, members):
    if not isinstance(activities, list): return None
    
    # 各記事のHTMLを生成（ソート前のインデックスをIDに使用）
    activities_with_html = []
    
    for i, activity in enumerate(activities):
        date_str = str(activity.get('date', ''))
        if date_str.startswith('member') or '@' in str(activity.get('title', '')): continue
        date = date_str.replace('.', '/')
        title = activity.get('title', '')
        content = activity.get('content', '')
        link = activity.get('link', '')
        tagged_ids = activity.get('taggedIds', [])
        
        # IDを固定（JSON内の元のインデックスを使用）
        item_id = f"activity-{i}"
        
        # 寄稿者アバターの生成
        avatar_items = []
        display_count = 0
        if tagged_ids:
            for m_id in tagged_ids:
                if not m_id or display_count >= MAX_AVATARS: continue
                if m_id in members:
                    m = members[m_id]
                    img = f'<img src="{m["avatar"]}" alt="{m["name"]}" title="{m["name"]}">' if (m.get('displaySetting') == '名前' and m.get('avatar')) else f'<span class="tag-icon" title="{m.get("name","")}">{m.get("initial","")}</span>'
                    avatar_items.append(f'<a href="members.html?id={m_id}" class="contributor-avatar">{img}</a>')
                    display_count += 1
            if len(tagged_ids) > MAX_AVATARS:
                avatar_items.append(f'<div class="plus-counter">+{len(tagged_ids) - MAX_AVATARS}</div>')
        
        contributors_html = ""
        if avatar_items:
            contributors_html = f'<div class="activity-contributors"><span class="contributors-label">ACTIVITY BY</span><div class="avatar-list">{"".join(avatar_items)}</div></div>'

        # View More ボタン（出し分け用）
        view_more_mobile = f'<a href="{link}" class="view-more-link view-more-mobile" target="_blank" rel="noopener">View More</a>' if link else ""
        view_more_pc = f'<a href="{link}" class="view-more-link view-more-for-pc" target="_blank" rel="noopener">View More</a>' if link else ""
        
        contributors_mobile = contributors_html.replace('activity-contributors', 'activity-contributors tags-for-mobile') if contributors_html else ""
        contributors_pc = contributors_html.replace('activity-contributors', 'activity-contributors tags-for-pc') if contributors_html else ""

        item_html = f"""
        <div class="activity-item" id="{item_id}">
            <div class="activity-left-col">
                <div class="activity-header-mobile">
                    <span class="activity-date">{date}</span>
                    {view_more_mobile}
                </div>
                <span class="activity-date tags-for-pc">{date}</span>
                {contributors_pc}
            </div>
            <div class="activity-content">
                <h4>{title}</h4>
                <p>{content}</p>
                {view_more_pc}
                {contributors_mobile}
            </div>
        </div>"""
        
        activities_with_html.append((date, item_html))

    # 日付の新しい順にソートしてHTMLを結合
    activities_with_html.sort(key=lambda x: x[0], reverse=True)
    html_parts = [item[1] for item in activities_with_html]
    
    return "\n".join(html_parts)

def update_activity_page():
    if not os.path.exists(ACTIVITIES_JSON_PATH): return
    members = {}
    if os.path.exists(MEMBERS_JSON_PATH):
        with open(MEMBERS_JSON_PATH, 'r', encoding='utf-8') as f: members = json.load(f)
    with open(ACTIVITIES_JSON_PATH, 'r', encoding='utf-8') as f:
        try: activities = json.load(f)
        except: return
    new_content = generate_activity_html(activities, members)
    if new_content is None: return
    with open(ACTIVITY_HTML_PATH, 'r', encoding='utf-8') as f: lines = f.readlines()
    with open(ACTIVITY_HTML_PATH, 'w', encoding='utf-8') as f:
        skip = False
        for line in lines:
            if '<!-- ACTIVITIES_START -->' in line:
                f.write(line); f.write(new_content + "\n"); skip = True
            elif '<!-- ACTIVITIES_END -->' in line: f.write(line); skip = False
            elif not skip: f.write(line)

if __name__ == "__main__": update_activity_page()
