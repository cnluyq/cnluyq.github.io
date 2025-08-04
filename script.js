// 数据存储键名
const STORAGE_KEY = 'issue_tracking_data';
let currentData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    document.getElementById('addBtn').addEventListener('click', openAddModal);
    document.getElementById('exportBtn').addEventListener('click', exportToJSON);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('dataForm').addEventListener('submit', handleFormSubmit);
}

// 渲染数据表格
function renderTable(data = currentData) {
    const tableBody = document.getElementById('dataTable');
    tableBody.innerHTML = '';

    data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${index + 1}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.keywords}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.problemTitle}</td>
            <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">${item.problemDesc}</td>
            <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                ${item.rootCause}
                ${renderFileBadges(item.rootCauseFiles)}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                ${item.solutions}
                ${renderFileBadges(item.solutionsFiles)}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                ${item.others}
                ${renderFileBadges(item.othersFiles)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editRecord(${index})" class="text-blue-600 hover:text-blue-900 mr-3" data-tooltip="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteRecord(${index})" class="text-red-600 hover:text-red-900" data-tooltip="删除">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// 渲染文件徽章
function renderFileBadges(files = []) {
    if (!files || files.length === 0) return '';
    return files.map(file => 
        `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1">
            <i class="fas fa-paperclip mr-1"></i>${file.name}
        </span>`
    ).join('');
}

// 打开添加模态框
function openAddModal() {
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('recordId').value = '';
    document.getElementById('dataForm').reset();
    ['rootCauseFiles', 'solutionsFiles', 'othersFiles'].forEach(id => {
        document.getElementById(id).innerHTML = '';
    });
}

// 关闭模态框
function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

// 处理表单提交
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const record = {
        keywords: formData.get('keywords'),
        problemTitle: formData.get('problemTitle'),
        problemDesc: formData.get('problemDesc'),
        rootCause: formData.get('rootCause'),
        solutions: formData.get('solutions'),
        others: formData.get('others'),
        rootCauseFiles: getFileInfo('rootCauseFile'),
        solutionsFiles: getFileInfo('solutionsFile'),
        othersFiles: getFileInfo('othersFile')
    };

    const recordId = formData.get('recordId');
    if (recordId) {
        currentData[recordId] = record;
    } else {
        currentData.push(record);
    }

    saveData();
    renderTable();
    closeModal();
}

// 获取文件信息
function getFileInfo(inputId) {
    const input = document.getElementById(inputId);
    if (!input.files || input.files.length === 0) return [];
    
    return Array.from(input.files).map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
    }));
}

// 预览文件
function previewFile(input, previewContainerId) {
    const container = document.getElementById(previewContainerId);
    container.innerHTML = '';
    
    if (input.files && input.files.length > 0) {
        Array.from(input.files).forEach(file => {
            const badge = document.createElement('span');
            badge.className = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1';
            badge.innerHTML = `<i class="fas fa-paperclip mr-1"></i>${file.name}`;
            container.appendChild(badge);
        });
    }
}

// 编辑记录
function editRecord(index) {
    const record = currentData[index];
    if (!record) return;

    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('recordId').value = index;
    document.getElementById('keywords').value = record.keywords || '';
    document.getElementById('problemTitle').value = record.problemTitle || '';
    document.getElementById('problemDesc').value = record.problemDesc || '';
    document.getElementById('rootCause').value = record.rootCause || '';
    document.getElementById('solutions').value = record.solutions || '';
    document.getElementById('others').value = record.others || '';

    // 渲染已有文件预览
    renderFilePreviews('rootCauseFiles', record.rootCauseFiles);
    renderFilePreviews('solutionsFiles', record.solutionsFiles);
    renderFilePreviews('othersFiles', record.othersFiles);
}

// 渲染文件预览
function renderFilePreviews(containerId, files = []) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    files.forEach(file => {
        const badge = document.createElement('span');
        badge.className = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1';
        badge.innerHTML = `<i class="fas fa-paperclip mr-1"></i>${file.name}`;
        container.appendChild(badge);
    });
}

// 删除记录
function deleteRecord(index) {
    if (confirm('确定要删除这条记录吗？')) {
        currentData.splice(index, 1);
        saveData();
        renderTable();
    }
}

// 保存数据到本地存储
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
}

// 处理搜索
function handleSearch(e) {
    const keyword = e.target.value.toLowerCase();
    if (!keyword) {
        renderTable();
        return;
    }

    const filteredData = currentData.filter(item => 
        Object.values(item).some(val => 
            String(val).toLowerCase().includes(keyword)
        )
    );
    renderTable(filteredData);
}

// 导出为JSON
function exportToJSON() {
    if (currentData.length === 0) {
        alert('没有数据可导出');
        return;
    }

    const dataStr = JSON.stringify(currentData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `issue_tracking_${new Date().toISOString().slice(0,10)}.json`;
    const linkElement = document.createElement('a');
    
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}
