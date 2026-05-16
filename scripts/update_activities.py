import json
import os
import datetime

ACTIVITY_HTML_PATH = 'activity.html'
MEMBERS_JSON_PATH = 'data/members.json'
ACTIVITIES_JSON_PATH = 'data/activities.json'
MAX_AVATARS = 15

def generate_activity_html(activities, members):
    if not isinstance(activities, list):
        return None
    
    # 【修正】日付の降順（新しい順）に並び替え
    def get_date(x):
        d = x.get('date', '1900/01/01').replace('.', '/')
        try:
            return datetime.datetime.strptime(d, '%Y/%m/%d')
        except:
            return datetime.datetime(1900, 1, 1)

    activities.sort(key=get_date, reverse=True)
    
    html_parts = []
    for i, act in enumerate(activities):
        date_str = str(act.get('date', ''))
        if date_str.startswith('member') or '@' in str(act.get('title', '')):
            continue
            
        date = date_str.replace('.', '/')
        title = act.get('title', '')
        content = act.get('content', '')
        link = act.get('link', '')
        tagged_ids = act.get('taggedIds', [])
        
        contributors_html = ""
        if tagged_ids:
            avatar_items = []
            display_count = 0
            for m_id in tagged_ids:
                if not m_id or display_count >= MAX_AVATARS: continue
                if m_id in members:
                    m = members[m_id]
                    if m.get('displaySetting') == '名前' and m.get('avatar'):
                        img = f'<img src="{m["avatar"]}" alt="{m["name"]}" title="{m["name"]}">'
                    else:
                        img = f'<span class="tag-icon" title="{m.get("name","")}">{m.get("initial","")}</span>'
                    avatar_items.append(f'<div class="contributor-avatar">{img}</div>')
                    display_count += 1
            if len(tagged_ids) > MAX_AVATARS:
                avatar_items.append(f'<div class="plus-counter">+{len(tagged_ids) - MAX_AVATARS}</div>')
            if avatar_items:
                contributors_html = f'<div class="activity-contributors"><span class="contributors-label">Activity By</span><div class="avatar-list">{"".join(avatar_items)}</div></div>'

        # 【修正】View Moreの矢印を削除（CSSに任せる）
        view_more_btn = f'<a href="{link}" class="view-more-link" target="_blank" rel="noopener">View More</a>' if link else ""
        
        item_html = f"""
        <div class="activity-item" id="activity-{i}">
            <div class="activity-left"><span class="activity-date">{date}</span>{contributors_html}</div>
            <div class="activity-content"><h4>{title}</h4><p>{content}</p>{view_more_btn}</div>
        </div>"""
        html_parts.append(item_html)
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
