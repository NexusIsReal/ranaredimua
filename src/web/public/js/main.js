/**
 * Discord Moderation Bot - Web Panel
 * Main JavaScript file
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Initialize popovers
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.map(function(popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });
  
  // Handle sidebar toggle for mobile
  const sidebarToggleBtn = document.getElementById('sidebarToggle');
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', function() {
      document.querySelector('.sidebar').classList.toggle('show');
    });
  }
  
  // Form validation
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      form.classList.add('was-validated');
    }, false);
  });
  
  // Dark Mode Toggle
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    // Check for saved dark mode preference
    const darkMode = localStorage.getItem('darkMode') === 'true';
    
    // Apply dark mode if preference exists
    if (darkMode) {
      document.body.classList.add('dark-mode');
      darkModeToggle.checked = true;
    }
    
    // Handle dark mode toggle change
    darkModeToggle.addEventListener('change', function() {
      if (this.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
      }
    });
  }
  
  // Auto-dismiss alerts after 5 seconds
  setTimeout(function() {
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    });
  }, 5000);
  
  // Select all checkboxes functionality
  const selectAllCheckboxes = document.querySelectorAll('[data-select-all]');
  selectAllCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const target = this.dataset.selectAll;
      const targetCheckboxes = document.querySelectorAll(`${target} input[type="checkbox"]`);
      
      targetCheckboxes.forEach(targetCheckbox => {
        targetCheckbox.checked = this.checked;
      });
    });
  });
  
  // Copy to clipboard functionality
  const copyButtons = document.querySelectorAll('[data-copy]');
  copyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const copyText = this.dataset.copy;
      const textArea = document.createElement('textarea');
      textArea.value = copyText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      // Show tooltip with "Copied!" message
      const tooltip = bootstrap.Tooltip.getInstance(this);
      const originalTitle = this.getAttribute('data-bs-original-title');
      
      this.setAttribute('data-bs-original-title', 'Copied!');
      tooltip.show();
      
      // Reset tooltip title after 1 second
      setTimeout(() => {
        this.setAttribute('data-bs-original-title', originalTitle);
        tooltip.hide();
      }, 1000);
    });
  });
}); 