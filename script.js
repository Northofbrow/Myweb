document.addEventListener('DOMContentLoaded', async () => {
    await loadCourses('math');
    document.querySelector('[onclick="loadCourses(\'math\')"]').classList.add('active');
});


async function loadCourses(category) {
    try {
        const loadingElement = document.getElementById('loading');
        const courseListElement = document.getElementById('courseList');
        
        // 显示加载动画
        loadingElement.style.display = 'block';
        courseListElement.innerHTML = ''; // 清空旧内容

        // 添加 5 秒超时限制
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('请求超时')), 5000)
        );

        const response = await Promise.race([
            fetch(`/Myweb/courses/${category}.json`),
            timeoutPromise
        ]);

        if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);
        
        const courses = await response.json();
        renderCourses(courses);
        
        // 更新导航状态
        document.querySelectorAll('.nav-link').forEach(link => 
            link.classList.remove('active')
        );
        document.querySelector(`[onclick="loadCourses('${category}')"]`)
            .classList.add('active');
        
    } catch (error) {
        document.getElementById('courseList').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    ${error.message || '数据加载失败'}
                </div>
            </div>
        `;
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}
  
  function renderCourses(coursesData) {
    const container = document.getElementById('courseList');
    container.innerHTML = coursesData.map(course => `
      <div class="col">
        <div class="card course-card h-100" onclick="showCourseDetail('${course.id}')">
          <div class="card-body">
            <h5 class="card-title">${course.name}</h5>
            <p class="text-muted">
              ${course.instructor ? course.instructor : ''}
              ${course.platform ? '· ' + course.platform : ''}
            </p>
            <p>${course.description || ''}</p>
            <div class="mb-2">
              ${(course.tags || []).map(tag => `
                <span class="badge bg-secondary">${tag}</span>
              `).join('')}
            </div>
            <div class="resources">
              ${(course.resources || []).map(res => `
                <a href="javascript:void(0)" 
                   class="btn btn-sm btn-outline-primary me-1"
                   onclick="event.stopPropagation(); window.open('${res.url}', '_blank')">
                  ${res.type}
                </a>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

async function getAllCourses() {
    const categories = ['math', 'circuit', 'programming'];
    const allCourses = [];
    
    for (const category of categories) {
        try {
            const response = await fetch(`Myweb/courses/${category}.json`);
            const data = await response.json();
            allCourses.push(...data);
        } catch (error) {
            console.error(`加载${category}数据失败:`, error);
        }
    }
    return allCourses;
}

async function showCourseDetail(courseId) {
    try {
        const allCourses = await getAllCourses();
        const course = allCourses.find(c => c.id === courseId);
        
        if (!course) throw new Error('未找到该课程');
        
        document.getElementById('modalTitle').textContent = course.name;
        document.getElementById('modalContent').innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <h6>课程信息</h6>
                    <p>${course.description || '暂无描述'}</p>
                    <div class="mb-3">
                        <h6>资源列表</h6>
                        ${(course.resources || []).map(res => `
                            <a href="${res.url}" target="_blank" class="d-block mb-2">
                                <i class="fas fa-${getResourceIcon(res.type)} me-2"></i>${res.type}
                            </a>
                        `).join('')}
                    </div>
                </div>
                <div class="col-md-8">
                    <h6>学习感悟</h6>
                    ${(course.reflections || []).map(ref => `
                        <div class="card reflection-card mb-3">
                            <div class="card-body">
                                <h6>${ref.title}</h6>
                                <p class="text-muted small">${ref.date}</p>
                                <p>${ref.content}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        new bootstrap.Modal(document.getElementById('courseModal')).show();
    } catch (error) {
        alert(error.message);
    }
}

function getResourceIcon(type) {
    const icons = {
        '视频': 'video',
        '课件': 'file-pdf',
        '作业': 'file-alt',
        '笔记': 'book'
    };
    return icons[type] || 'link';
}

function searchCourses() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!keyword) return;
    
    getAllCourses().then(allCourses => {
        const results = allCourses.filter(course => 
            course.name.toLowerCase().includes(keyword) ||
            (course.description || '').toLowerCase().includes(keyword) ||
            (course.tags || []).some(tag => tag.toLowerCase().includes(keyword))
        );
        
        renderCourses(results);
    });
}

