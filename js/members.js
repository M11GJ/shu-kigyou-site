/* js/members.js */

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbzj5hYX7dLV5bo8nRel0-BBaemw_n039rdBc21aeemmLQ-eqtpfTEB7SNOo1iQI5fgIXA/exec';

let memberData = {};
let activityData = []; // 活動データを保持する変数を追加

const LOCAL_JSON_URL = 'data/members.json';
const ACTIVITIES_JSON_URL = 'data/activities.json'; // 追加

// Fetch data from local JSON or fallback to GAS API
async function fetchMemberData() {
    const grid = document.querySelector('.members-grid');
    if (!grid) return; // Do nothing if not on members.html
    grid.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1 / -1; color:#666;">データを読み込んでいます...</p>';
    
    try {
        // 1. Try to fetch the local JSON first (GitHub Actions auto-generated)
        const response = await fetch(LOCAL_JSON_URL + '?t=' + new Date().getTime()); // cache buster
        if (!response.ok) throw new Error('Local JSON not found or invalid');
        memberData = await response.json();
        
        // 追加: 活動一覧も読み込む
        try {
            const actRes = await fetch(ACTIVITIES_JSON_URL + '?t=' + new Date().getTime());
            if (actRes.ok) activityData = await actRes.json();
        } catch (e) { console.log('Activities not found'); }

        renderMembersGrid();
        checkUrlParamsForModal(); // URLパラメータをチェックしてモーダルを開く
    } catch (localError) {
        console.log('Local JSON not found, falling back to GAS API...', localError);
        // 2. Fallback to GAS API if local JSON fails (e.g., local dev)
        try {
            const response = await fetch(GAS_API_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            memberData = await response.json();
            renderMembersGrid();
            checkUrlParamsForModal(); // URLパラメータをチェックしてモーダルを開く
        } catch (gasError) {
            console.error('Failed to fetch member data from both sources:', gasError);
            grid.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1 / -1; color:red;">データの読み込みに失敗しました。</p>';
        }
    }
}

// Generate Members Grid
function renderMembersGrid() {
    const grid = document.querySelector('.members-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    // Convert memberData to array and sort by lastUpdated (newest first)
    const sortedMembers = Object.entries(memberData).sort((a, b) => {
        const dateA = new Date(a[1].lastUpdated || 0).getTime();
        const dateB = new Date(b[1].lastUpdated || 0).getTime();
        return dateB - dateA; 
    });

    for (const [id, data] of sortedMembers) {
        // Resolve display name
        const isInitialMode = data.displaySetting === 'イニシャル';
        const displayName = (isInitialMode && data.initial) ? data.initial : (data.name || data.initial || 'No Name');
        data._resolvedName = displayName; // Save for modal use

        // default avatar logic
        let avatarSrc = data.avatar ? data.avatar.trim() : '';
        // If avatar doesn't start with http, ignore it (prevent broken img tags)
        if (avatarSrc && !avatarSrc.startsWith('http')) {
            avatarSrc = '';
        }
        
        // Determine header color based on year
        const headerColor = data.headerColor || getYearColor(data.year);
        data.headerColor = headerColor; // save back for modal
        data.avatarType = avatarSrc ? 'image' : 'icon';
        data.avatarContent = avatarSrc || '<i class="fa-solid fa-user"></i>';

        const avatarHtml = avatarSrc 
            ? `<img src="${avatarSrc}" alt="${displayName}" class="member-avatar">`
            : `<div class="member-avatar" style="color: #ccc;"><i class="fa-solid fa-user"></i></div>`;

        const cardHtml = `
        <div class="member-card" onclick="openMemberModal('${id}')" data-skills="${data.skills ? data.skills.join(',') : ''}" data-name="${displayName}" data-year="${data.year || ''}">
            <div class="member-card-header" style="background: ${headerColor};">
                <div class="member-avatar-wrapper">
                    ${avatarHtml}
                </div>
            </div>
            <div class="member-info">
                <h3 class="member-name">${displayName}</h3>
                <p class="member-role">${data.role || ''}</p>
                <div class="member-tags">
                    ${(data.skills || []).slice(0, 2).map(skill => `<span class="tag">#${skill}</span>`).join('')}
                </div>
            </div>
        </div>
        `;
        grid.innerHTML += cardHtml;
    }
}

// Get dynamic background gradient based on year
function getYearColor(yearStr) {
    if (!yearStr) return 'linear-gradient(135deg, var(--primary-color) 0%, #038c7b 100%)';
    const str = yearStr.toString().toLowerCase().trim();
    
    if (str === '1' || str.includes('1年')) return 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)'; // Green
    if (str === '2' || str.includes('2年')) return 'linear-gradient(135deg, #2196F3 0%, #1565C0 100%)'; // Blue
    if (str === '3' || str.includes('3年')) return 'linear-gradient(135deg, #FF9800 0%, #EF6C00 100%)'; // Orange
    if (str === '4' || str.includes('4年')) return 'linear-gradient(135deg, #9C27B0 0%, #6A1B9A 100%)'; // Purple
    if (str.includes('m') || str.includes('院') || str.includes('ob') || str.includes('og') || str.includes('修士')) return 'linear-gradient(135deg, #263238 0%, #000000 100%)'; // Dark
    
    return 'linear-gradient(135deg, var(--primary-color) 0%, #038c7b 100%)'; // Default
}

// Open Modal Function
function openMemberModal(memberId) {
    const data = memberData[memberId];
    if (!data) return;

    const modalContent = document.getElementById('memberModalContent');
    const overlay = document.getElementById('memberModalOverlay');

    // Generate Avatar HTML
    let avatarHtml = '';
    if (data.avatarType === 'image') {
        avatarHtml = `<img src="${data.avatarContent}" alt="${data._resolvedName}" class="modal-avatar">`;
    } else {
        avatarHtml = `<div class="modal-avatar" style="color: #ccc;">${data.avatarContent}</div>`;
    }

    // Generate SNS HTML
    // data.sns from API is an array of URLs: ['https://x.com/...', 'https://github.com/...', '']
    let snsHtml = '';
    const snsUrls = data.sns || [];
    snsUrls.forEach(url => {
        if (!url || !url.trim()) return;
        const lowerUrl = url.toLowerCase();
        let iconClass = 'fa-solid fa-link'; // Default icon
        
        if (lowerUrl.includes('x.com') || lowerUrl.includes('twitter.com')) {
            iconClass = 'fa-brands fa-x-twitter';
        } else if (lowerUrl.includes('instagram.com')) {
            iconClass = 'fa-brands fa-instagram';
        } else if (lowerUrl.includes('github.com')) {
            iconClass = 'fa-brands fa-github';
        } else if (lowerUrl.includes('linkedin.com')) {
            iconClass = 'fa-brands fa-linkedin';
        } else if (lowerUrl.includes('facebook.com')) {
            iconClass = 'fa-brands fa-facebook';
        } else if (lowerUrl.includes('youtube.com')) {
            iconClass = 'fa-brands fa-youtube';
        } else if (lowerUrl.includes('note.com')) {
            iconClass = 'fa-solid fa-pen-nib'; // Note.com approximation
        }

        snsHtml += `<a href="${url}" class="sns-link" target="_blank"><i class="${iconClass}"></i></a>`;
    });

    // Generate Skills HTML
    const skillsList = (data.skills || []).filter(s => s.trim() !== '');
    let skillsHtml = '';
    if (skillsList.length > 0) {
        let skillsTags = skillsList.map(skill => 
            `<span class="modal-skill-tag"><i class="fa-solid fa-check"></i> ${skill}</span>`
        ).join('');
        skillsHtml = `
            <div class="modal-section">
                <h3 class="modal-section-title"><i class="fa-solid fa-bolt"></i> スキル・得意分野</h3>
                <div class="modal-skills">
                    ${skillsTags}
                </div>
            </div>
        `;
    }

    // Generate Certifications HTML
    let certsHtml = '';
    const certsList = (data.certifications || []).filter(c => c.trim() !== '');
    if (certsList.length > 0) {
        let certsTags = certsList.map(cert => 
            `<span class="modal-skill-tag" style="background: #f0f0f0; color: #333; border: 1px solid #ddd;"><i class="fa-solid fa-award" style="color: #FFB300;"></i> ${cert}</span>`
        ).join('');
        certsHtml = `
            <div class="modal-section">
                <h3 class="modal-section-title"><i class="fa-solid fa-certificate"></i> 資格・検定</h3>
                <div class="modal-skills">
                    ${certsTags}
                </div>
            </div>
        `;
    }

    // Generate Timeline HTML
    // 1. 個人のタイムラインデータ
    let combinedTimeline = [...(data.timeline || [])];
    
    // 2. 活動一覧(activities.json)から自分がタグ付けされているものを自動抽出して合流
    if (activityData && activityData.length > 0) {
        const autoActivities = activityData
            .map((act, index) => ({ ...act, originalIndex: index })) // 元の並び順をIDとして保持
            .filter(act => act.taggedIds && act.taggedIds.includes(memberId))
            .map(act => ({
                date: act.date,
                title: act.title,
                content: act.content,
                link: act.link,
                jumpLink: `activity.html#activity-${act.originalIndex}`, // ジャンプ先
                type: 'club',
                isAuto: true // 自動取得フラグ
            }));
        combinedTimeline = [...combinedTimeline, ...autoActivities];
    }

    let timelineHtml = '';
    if (combinedTimeline.length > 0) {
        // 全て合流させた後に日付順（新しい順）でソート
        const sortedTimeline = combinedTimeline.sort((a, b) => b.date.localeCompare(a.date));
        
        let timelineItemsHtml = sortedTimeline.map(item => {
            const isClub = item.type === 'club';
            const dotClass = isClub ? '' : 'personal';
            const iconClass = isClub ? 'fa-building' : 'fa-user';
            const badgeClass = isClub ? 'badge-club' : 'badge-personal';
            const badgeText = isClub ? '起業部' : '個人の実績';
            const dateColor = isClub ? 'var(--primary-color)' : '#4D96FF';

            // 自動連携された活動（isAuto）の場合はタイトルをリンクにし、本文を隠す
            const displayTitle = item.isAuto && item.jumpLink 
                ? `<a href="${item.jumpLink}" style="color: inherit; text-decoration: none;">${item.title} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.8em; margin-left: 5px; opacity: 0.6;"></i></a>` 
                : item.title;
            
            const displayContent = item.isAuto ? '' : `<p>${item.content}</p>`;
            const detailLink = (item.link && !item.isAuto) ? `<a href="${item.link}" class="timeline-link" target="_blank"><i class="fa-solid fa-link"></i> 詳細を見る</a>` : '';

            return `
            <div class="timeline-item">
                <div class="timeline-dot ${dotClass}"><i class="fa-solid ${iconClass}"></i></div>
                <span class="timeline-date" style="color: ${dateColor};">${item.date}</span>
                <div class="timeline-content">
                    <span class="timeline-type-badge ${badgeClass}">${badgeText}</span>
                    <h4>${displayTitle}</h4>
                    ${displayContent}
                    ${detailLink}
                </div>
            </div>
            `;
        }).join('');
        
        timelineHtml = `
            <div class="modal-section">
                <h3 class="modal-section-title"><i class="fa-solid fa-clock-rotate-left"></i> 活動履歴・プロジェクト</h3>
                <div class="timeline">
                    ${timelineItemsHtml}
                </div>
            </div>
        `;
    }

    // Generate Message HTML
    let messageHtml = '';
    if (data.message && data.message.trim() !== '') {
        messageHtml = `
            <div class="modal-section">
                <h3 class="modal-section-title"><i class="fa-solid fa-comment-dots"></i> メッセージ</h3>
                <div class="modal-message">
                    ${data.message}
                </div>
            </div>
        `;
    }

    const headerColor = data.headerColor || 'linear-gradient(135deg, var(--primary-color) 0%, #038c7b 100%)';

    // Inject HTML into Modal
    modalContent.innerHTML = `
        <button class="modal-close" onclick="closeMemberModal()"><i class="fa-solid fa-xmark"></i></button>
        
        <div class="modal-header" style="background: ${headerColor};">
            <div class="modal-avatar-wrapper">
                ${avatarHtml}
            </div>
            <div class="modal-header-info">
                <h2 class="modal-name">${data._resolvedName}</h2>
                ${data.role ? `<p class="modal-role">${data.role}</p>` : ''}
                ${(data.department || data.year) ? `<p class="modal-department">${data.department || ''} ${data.year || ''}</p>` : ''}
                <div class="modal-sns">
                    ${snsHtml}
                </div>
            </div>
        </div>

        <div class="modal-body">
            ${messageHtml}
            ${skillsHtml}
            ${certsHtml}
            ${timelineHtml}
            ${(!messageHtml && !skillsHtml && !certsHtml && !timelineHtml) ? '<p style="text-align:center; color:#999; margin-top:20px;">まだプロフィール情報が登録されていません。</p>' : ''}
        </div>
    `;

    // Show Modal
    overlay.classList.add('active');
    document.body.classList.add('modal-open');
}

// Close Modal Function
function closeMemberModal() {
    const overlay = document.getElementById('memberModalOverlay');
    overlay.classList.remove('active');
    document.body.classList.remove('modal-open');
}

// Close modal on clicking outside
document.getElementById('memberModalOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closeMemberModal();
    }
});

// Check URL parameters to open specific member profile automatically
function checkUrlParamsForModal() {
    const urlParams = new URLSearchParams(window.location.search);
    const memberId = urlParams.get('id');
    if (memberId && memberData[memberId]) {
        // slight delay for smoother transition if page is still rendering
        setTimeout(() => {
            openMemberModal(memberId);
        }, 100);
    }
}

// Global scope for filtering
let searchInput;
let filterBtns;

function applyFilters() {
    if (!filterBtns || !searchInput) return;
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    const activeFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
    const searchTerm = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll('.member-card');

    cards.forEach(card => {
        const skills = card.dataset.skills ? card.dataset.skills.toLowerCase() : '';
        const name = card.dataset.name ? card.dataset.name.toLowerCase() : '';
        const year = card.dataset.year ? card.dataset.year.toLowerCase() : '';
        
        // Search filter
        const matchesSearch = name.includes(searchTerm) || skills.includes(searchTerm);
        
        // Category filter (by year)
        let matchesCategory = true;
        if (activeFilter !== 'all') {
            if (activeFilter === 'obog') {
                if (!year.includes('m') && !year.includes('院') && !year.includes('ob') && !year.includes('og') && !year.includes('修士')) {
                    matchesCategory = false;
                }
            } else {
                if (!year.includes(activeFilter) && year !== activeFilter.replace('年', '')) {
                    matchesCategory = false;
                }
            }
        }

        if (matchesSearch && matchesCategory) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Start fetching data immediately
    fetchMemberData();

    // Filter UI logic initialization
    filterBtns = document.querySelectorAll('.filter-btn');
    searchInput = document.getElementById('memberSearch');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            applyFilters();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
});
