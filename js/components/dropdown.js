// OpsHub Custom Dropdown Component (Themed & Searchable)

export class CustomSelect {
  constructor(element, options = { hasSearch: false, iconMap: null, placeholder: "Select option" }) {
    this.originalSelect = element;
    this.options = options;
    this.isOpen = false;
    this.highlightedIndex = -1;

    // Build options list from original select if not supplied
    this.items = this.parseOriginalOptions();
    this.selectedValue = this.originalSelect.value;
    
    this.initDOM();
    this.bindEvents();
  }

  parseOriginalOptions() {
    return Array.from(this.originalSelect.options).map(opt => ({
      value: opt.value,
      label: opt.text,
      icon: this.options.iconMap ? this.options.iconMap[opt.value] : null
    }));
  }

  initDOM() {
    // Hide original select
    this.originalSelect.style.display = "none";

    // Create container
    this.container = document.createElement("div");
    this.container.className = "custom-select-container";
    if (this.originalSelect.id) {
      this.container.id = "custom-" + this.originalSelect.id;
    }

    // Selected item label
    const selectedItem = this.items.find(item => item.value === this.selectedValue) || this.items[0];
    const triggerHtml = `
      <div class="custom-select-trigger" tabindex="0" role="combobox" aria-expanded="false">
        <span class="custom-select-value-wrapper">
          ${this.options.triggerIcon ? `<i data-lucide="${this.options.triggerIcon}" class="opt-icon-trigger" style="margin-right:6px"></i>` : ''}
          ${selectedItem && selectedItem.icon ? `<i data-lucide="${selectedItem.icon}" class="opt-icon-trigger"></i>` : ''}
          <span class="custom-select-text">${selectedItem ? selectedItem.label : this.options.placeholder}</span>
        </span>
        <i data-lucide="chevron-down" class="dropdown-chevron"></i>
      </div>
    `;

    // Dropdown options container
    const dropdownHtml = `
      <div class="custom-select-options-wrapper">
        ${this.options.hasSearch ? `
          <div class="custom-select-search-box">
            <input type="text" class="custom-select-search-input" placeholder="Search..." autocomplete="off">
          </div>
        ` : ''}
        <div class="custom-select-options-list" role="listbox">
          ${this.items.map((item, idx) => `
            <div class="custom-select-option ${item.value === this.selectedValue ? 'selected' : ''}" data-value="${item.value}" role="option" data-index="${idx}">
              ${item.icon ? `<i data-lucide="${item.icon}" class="opt-icon"></i>` : ''}
              <span class="opt-text">${item.label}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    this.container.innerHTML = triggerHtml + dropdownHtml;
    
    // Insert after original select
    this.originalSelect.parentNode.insertBefore(this.container, this.originalSelect.nextSibling);

    this.trigger = this.container.querySelector(".custom-select-trigger");
    this.dropdown = this.container.querySelector(".custom-select-options-wrapper");
    this.list = this.container.querySelector(".custom-select-options-list");
    this.searchInput = this.container.querySelector(".custom-select-search-input");
    this.optionElements = this.container.querySelectorAll(".custom-select-option");

    lucide.createIcons({
      attrs: { class: 'lucide-icon' },
      nameAttr: 'data-lucide',
      nodeList: this.container.querySelectorAll('[data-lucide]')
    });
  }

  bindEvents() {
    // Toggle dropdown on click
    this.trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Option clicks
    this.container.addEventListener("click", (e) => {
      const option = e.target.closest(".custom-select-option");
      if (option) {
        e.stopPropagation();
        this.select(option.dataset.value);
      }
    });

    // Keyboard accessibility on trigger
    this.trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        this.open();
      }
    });

    // Navigation and search inside dropdown
    this.container.addEventListener("keydown", (e) => {
      if (!this.isOpen) return;

      if (e.key === "Escape") {
        this.close();
        this.trigger.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        this.navigate(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.navigate(-1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (this.highlightedIndex >= 0) {
          const visibleOptions = this.getVisibleOptions();
          const target = visibleOptions[this.highlightedIndex];
          if (target) this.select(target.dataset.value);
        }
      }
    });

    // Search query matching
    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        this.filterOptions(query);
      });
      // Prevent spacebar inside search input from toggling/closing
      this.searchInput.addEventListener("keydown", (e) => {
        if (e.key === " ") e.stopPropagation();
      });
    }

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (this.isOpen && !this.container.contains(e.target)) {
        this.close();
      }
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    if (this.isOpen) return;
    
    // Close other open custom select items
    document.querySelectorAll(".custom-select-container.open").forEach(container => {
      const select = container.previousSibling;
      if (select && select.customSelectInstance) {
        select.customSelectInstance.close();
      }
    });

    this.isOpen = true;
    this.container.classList.add("open");
    this.trigger.setAttribute("aria-expanded", "true");
    
    if (this.searchInput) {
      this.searchInput.value = "";
      this.filterOptions("");
      setTimeout(() => this.searchInput.focus(), 50);
    }
    
    this.highlightedIndex = Array.from(this.optionElements).findIndex(opt => opt.classList.contains("selected"));
    this.scrollToHighlighted();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.container.classList.remove("open");
    this.trigger.setAttribute("aria-expanded", "false");
    this.highlightedIndex = -1;
    this.optionElements.forEach(opt => opt.classList.remove("highlighted"));
  }

  select(value) {
    this.selectedValue = value;
    this.originalSelect.value = value;
    
    // Dispatch change event to original select
    const event = new Event("change", { bubbles: true });
    this.originalSelect.dispatchEvent(event);

    // Update label & icon
    const selectedItem = this.items.find(item => item.value === value);
    const textNode = this.trigger.querySelector(".custom-select-text");
    const wrapper = this.trigger.querySelector(".custom-select-value-wrapper");
    
    if (selectedItem) {
      wrapper.innerHTML = `
        ${selectedItem.icon ? `<i data-lucide="${selectedItem.icon}" class="opt-icon-trigger"></i>` : ''}
        <span class="custom-select-text">${selectedItem.label}</span>
      `;
      lucide.createIcons({
        attrs: { class: 'lucide-icon' },
        nameAttr: 'data-lucide',
        nodeList: wrapper.querySelectorAll('[data-lucide]')
      });
    }

    // Toggle selected class
    this.optionElements.forEach(opt => {
      if (opt.dataset.value === value) {
        opt.classList.add("selected");
      } else {
        opt.classList.remove("selected");
      }
    });

    this.close();
    this.trigger.focus();
  }

  getVisibleOptions() {
    return Array.from(this.optionElements).filter(opt => opt.style.display !== "none");
  }

  filterOptions(query) {
    this.optionElements.forEach(opt => {
      const text = opt.querySelector(".opt-text").textContent.toLowerCase();
      if (text.includes(query)) {
        opt.style.display = "flex";
      } else {
        opt.style.display = "none";
      }
    });
    
    this.highlightedIndex = 0;
    const visibleOptions = this.getVisibleOptions();
    this.optionElements.forEach(opt => opt.classList.remove("highlighted"));
    if (visibleOptions[0]) visibleOptions[0].classList.add("highlighted");
  }

  navigate(dir) {
    const visibleOptions = this.getVisibleOptions();
    if (visibleOptions.length === 0) return;

    this.highlightedIndex += dir;
    if (this.highlightedIndex < 0) {
      this.highlightedIndex = visibleOptions.length - 1;
    } else if (this.highlightedIndex >= visibleOptions.length) {
      this.highlightedIndex = 0;
    }

    this.optionElements.forEach(opt => opt.classList.remove("highlighted"));
    const target = visibleOptions[this.highlightedIndex];
    if (target) {
      target.classList.add("highlighted");
      this.scrollToHighlighted();
    }
  }

  scrollToHighlighted() {
    const visibleOptions = this.getVisibleOptions();
    const target = visibleOptions[this.highlightedIndex];
    if (!target) return;

    const listHeight = this.list.clientHeight;
    const scrollTop = this.list.scrollTop;
    const targetTop = target.offsetTop;
    const targetHeight = target.clientHeight;

    if (targetTop + targetHeight > scrollTop + listHeight) {
      this.list.scrollTop = targetTop + targetHeight - listHeight;
    } else if (targetTop < scrollTop) {
      this.list.scrollTop = targetTop;
    }
  }

  syncValue() {
    this.selectedValue = this.originalSelect.value;
    const selectedItem = this.items.find(item => item.value === this.selectedValue);
    const wrapper = this.trigger.querySelector(".custom-select-value-wrapper");
    if (wrapper) {
      wrapper.innerHTML = `
        ${this.options.triggerIcon ? `<i data-lucide="${this.options.triggerIcon}" class="opt-icon-trigger" style="margin-right:6px"></i>` : ''}
        ${selectedItem && selectedItem.icon ? `<i data-lucide="${selectedItem.icon}" class="opt-icon-trigger"></i>` : ''}
        <span class="custom-select-text">${selectedItem ? selectedItem.label : this.options.placeholder}</span>
      `;
      lucide.createIcons({
        attrs: { class: 'lucide-icon' },
        nameAttr: 'data-lucide',
        nodeList: wrapper.querySelectorAll('[data-lucide]')
      });
    }

    this.optionElements.forEach(opt => {
      if (opt.dataset.value === this.selectedValue) {
        opt.classList.add("selected");
      } else {
        opt.classList.remove("selected");
      }
    });
  }
}

// Convert all native selects in a scope into custom select widgets
export function convertSelects(container = document, extraOptions = {}) {
  const selects = container.querySelectorAll("select");
  selects.forEach(select => {
    // Skip if already converted
    if (select.nextSibling && select.nextSibling.classList && select.nextSibling.classList.contains("custom-select-container")) {
      if (select.customSelectInstance) {
        select.customSelectInstance.syncValue();
      }
      return;
    }
    
    const isSearchable = select.options.length > 8; // Auto search for long listings
    const selectInstance = new CustomSelect(select, { 
      hasSearch: isSearchable,
      placeholder: select.getAttribute("placeholder") || "Select option",
      ...extraOptions
    });
    
    // Save reference for controls
    select.customSelectInstance = selectInstance;
  });
}
