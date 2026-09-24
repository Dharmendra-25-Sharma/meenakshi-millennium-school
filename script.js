/* ==========================================================================
   Meenakshi Millennium Public School - Main JavaScript Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initial setup
  initTheme();
  initScrollAnimations();
  initFormHandler();
  initAdminModal();
  initGalleryLightbox();
  initTeamFilter();
  initMobileMenu();
});

/* -------------------------------------------------------------------------- */
/* 1. Theme (Night Mode) Toggle Logic                                         */
/* -------------------------------------------------------------------------- */
function initTheme() {
  const themeBtn = document.getElementById('themeToggleBtn');
  const storedTheme = localStorage.getItem('schoolTheme') || 'light';
  
  document.documentElement.setAttribute('data-theme', storedTheme);
  updateThemeIcon(storedTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('schoolTheme', newTheme);
      updateThemeIcon(newTheme);
      
      showToast(`Switched to ${newTheme === 'dark' ? 'Night (Dark)' : 'Day (Light)'} Mode`);
    });
  }
}

function updateThemeIcon(theme) {
  const themeBtn = document.getElementById('themeToggleBtn');
  if (!themeBtn) return;
  
  if (theme === 'dark') {
    themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    themeBtn.setAttribute('title', 'Switch to Light Mode');
  } else {
    themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    themeBtn.setAttribute('title', 'Switch to Night Mode');
  }
}

/* -------------------------------------------------------------------------- */
/* 2. IntersectionObserver Scroll Animations                                  */
/* -------------------------------------------------------------------------- */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal');
  
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.12
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Optionally unobserve after revealing once
        // observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(el => revealObserver.observe(el));
}

/* -------------------------------------------------------------------------- */
/* 3. Admission & Inquiry Form Handler                                         */
/* -------------------------------------------------------------------------- */
function initFormHandler() {
  const form = document.getElementById('admissionForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const studentName = document.getElementById('studentName').value.trim();
    const parentName = document.getElementById('parentName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const gradeClass = document.getElementById('gradeClass').value;
    const message = document.getElementById('message').value.trim();

    if (!studentName || !parentName || !phone) {
      showToast('Please fill out all required fields marked with *', 'error');
      return;
    }

    const newSubmission = {
      id: 'SUB-' + Date.now(),
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      studentName,
      parentName,
      phone,
      email: email || 'N/A',
      gradeClass: gradeClass || 'Preschool / General Inquiry',
      message: message || 'No message provided'
    };

    // Store in localStorage
    const existingSubmissions = JSON.parse(localStorage.getItem('schoolFormSubmissions') || '[]');
    existingSubmissions.unshift(newSubmission);
    localStorage.setItem('schoolFormSubmissions', JSON.stringify(existingSubmissions));

    // Reset Form
    form.reset();

    // Show Confirmation Modal
    showToast('Inquiry submitted successfully! We will contact you soon.', 'success');
    openConfirmationModal(newSubmission);
    
    // Refresh admin table if open
    renderAdminTable();
  });
}

function openConfirmationModal(data) {
  const modal = document.getElementById('confirmationModal');
  const modalBody = document.getElementById('confirmationModalDetails');
  
  if (modal && modalBody) {
    modalBody.innerHTML = `
      <div style="text-align: center; padding: 1rem 0;">
        <i class="fa-solid fa-circle-check" style="font-size: 3.5rem; color: var(--brand-green); margin-bottom: 1rem;"></i>
        <h3 style="margin-bottom: 0.5rem;">Admission Inquiry Received!</h3>
        <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 1.5rem;">
          Thank you, <strong>${data.parentName}</strong>. We have registered your inquiry for <strong>${data.studentName}</strong>.
        </p>
        <div style="background: var(--bg-surface-elevated); padding: 1rem; border-radius: var(--radius-sm); text-align: left; font-size: 0.875rem;">
          <p><strong>Reference ID:</strong> ${data.id}</p>
          <p><strong>Contact No:</strong> ${data.phone}</p>
          <p><strong>Class/Grade:</strong> ${data.gradeClass}</p>
          <p><strong>Visiting Hours:</strong> 08:00 AM to 01:00 PM</p>
        </div>
      </div>
    `;
    modal.classList.add('active');
  }
}

/* -------------------------------------------------------------------------- */
/* 4. Form Access / Admin Submissions View Modal                             */
/* -------------------------------------------------------------------------- */
function initAdminModal() {
  const openBtn = document.getElementById('accessFormBtn');
  const modal = document.getElementById('adminModal');
  const closeBtn = document.getElementById('closeAdminModal');
  const exportBtn = document.getElementById('exportSubmissionsBtn');
  const clearAllBtn = document.getElementById('clearSubmissionsBtn');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      renderAdminTable();
      modal.classList.add('active');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  // Close modals on clicking backdrop
  document.querySelectorAll('.modal-backdrop').forEach(modalEl => {
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) {
        modalEl.classList.remove('active');
      }
    });
  });

  if (exportBtn) {
    exportBtn.addEventListener('click', exportSubmissionsToCSV);
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all form submissions?')) {
        localStorage.removeItem('schoolFormSubmissions');
        renderAdminTable();
        showToast('All submissions cleared.');
      }
    });
  }
}

function renderAdminTable() {
  const tableBody = document.getElementById('submissionsTableBody');
  const emptyState = document.getElementById('emptySubmissionsState');
  const submissions = JSON.parse(localStorage.getItem('schoolFormSubmissions') || '[]');

  if (!tableBody) return;

  if (submissions.length === 0) {
    tableBody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  tableBody.innerHTML = submissions.map((sub, idx) => `
    <tr>
      <td><strong>${sub.id}</strong><br><small style="color: var(--text-muted);">${sub.timestamp}</small></td>
      <td><strong>${sub.studentName}</strong></td>
      <td>${sub.parentName}</td>
      <td><a href="tel:${sub.phone}" style="color: var(--brand-blue); font-weight: bold;">${sub.phone}</a></td>
      <td><span class="badge" style="background: rgba(59, 130, 246, 0.1); color: var(--brand-blue); border-color: rgba(59, 130, 246, 0.3);">${sub.gradeClass}</span></td>
      <td style="max-width: 180px; font-size: 0.8rem;">${sub.message}</td>
      <td>
        <button onclick="deleteSubmission('${sub.id}')" style="background: none; border: none; color: var(--brand-accent); cursor: pointer; font-size: 1rem;" title="Delete Record">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

window.deleteSubmission = function(id) {
  let submissions = JSON.parse(localStorage.getItem('schoolFormSubmissions') || '[]');
  submissions = submissions.filter(s => s.id !== id);
  localStorage.setItem('schoolFormSubmissions', JSON.stringify(submissions));
  renderAdminTable();
  showToast('Submission deleted');
};

function exportSubmissionsToCSV() {
  const submissions = JSON.parse(localStorage.getItem('schoolFormSubmissions') || '[]');
  if (submissions.length === 0) {
    showToast('No submissions available to export', 'error');
    return;
  }

  const headers = ['Ref ID', 'Timestamp', 'Student Name', 'Parent Name', 'Phone', 'Email', 'Grade/Class', 'Message'];
  const csvRows = [headers.join(',')];

  submissions.forEach(sub => {
    const row = [
      `"${sub.id}"`,
      `"${sub.timestamp}"`,
      `"${sub.studentName.replace(/"/g, '""')}"`,
      `"${sub.parentName.replace(/"/g, '""')}"`,
      `"${sub.phone}"`,
      `"${sub.email}"`,
      `"${sub.gradeClass}"`,
      `"${sub.message.replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `Meenakshi_School_Form_Submissions_${Date.now()}.csv`);
  a.click();
}

/* -------------------------------------------------------------------------- */
/* 5. Team Filter Tabs                                                        */
/* -------------------------------------------------------------------------- */
function initTeamFilter() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const teamCards = document.querySelectorAll('.team-card');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.getAttribute('data-category');

      teamCards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* -------------------------------------------------------------------------- */
/* 6. Gallery Lightbox Viewer                                                */
/* -------------------------------------------------------------------------- */
function initGalleryLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImage');

  if (!lightbox || !lightboxImg) return;

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (img) {
        lightboxImg.src = img.src;
        lightbox.classList.add('active');
      }
    });
  });

  lightbox.addEventListener('click', () => {
    lightbox.classList.remove('active');
  });
}

/* -------------------------------------------------------------------------- */
/* 7. Mobile Navigation Toggle                                                 */
/* -------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      toggleBtn.innerHTML = navMenu.classList.contains('active') 
        ? '<i class="fa-solid fa-xmark"></i>' 
        : '<i class="fa-solid fa-bars"></i>';
    });
  }
}

/* -------------------------------------------------------------------------- */
/* 8. Toast System Helper                                                     */
/* -------------------------------------------------------------------------- */
function showToast(message, type = 'info') {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  const icon = type === 'error' ? 'fa-circle-xmark' : (type === 'success' ? 'fa-circle-check' : 'fa-circle-info');
  const color = type === 'error' ? 'var(--brand-accent)' : (type === 'success' ? 'var(--brand-green)' : 'var(--brand-blue)');

  toast.innerHTML = `
    <i class="fa-solid ${icon}" style="color: ${color}; font-size: 1.25rem;"></i>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
