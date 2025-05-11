// Dark mode toggle functionality
const toggle = document.getElementById("mode-toggle");
toggle.addEventListener("change", function () {
  if (this.checked) {
    document.body.classList.add("dark-mode");
    localStorage.setItem("darkMode", "enabled");
    this.setAttribute("aria-checked", "true");
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.body.classList.remove("dark-mode");
    localStorage.setItem("darkMode", "disabled");
    this.setAttribute("aria-checked", "false");
    document.documentElement.setAttribute("data-theme", "light");
  }
});

// Check for saved user preference
const savedMode = localStorage.getItem("darkMode");
if (savedMode === "enabled") {
  toggle.checked = true;
  toggle.setAttribute("aria-checked", "true");
  document.body.classList.add("dark-mode");
  document.documentElement.setAttribute("data-theme", "dark");
} else {
  toggle.setAttribute("aria-checked", "false");
  document.documentElement.setAttribute("data-theme", "light");
}

// Table sorting functionality
document.querySelectorAll("th button").forEach((button) => {
  button.addEventListener("click", () => {
    const column = button.getAttribute("data-column");
    const table = button.closest("table");
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    // Reset all other sort indicators
    document.querySelectorAll("th button").forEach((btn) => {
      if (btn !== button) {
        btn.setAttribute("aria-sort", "none");
        btn.classList.remove("sort-asc", "sort-desc");
      }
    });

    // Determine sort direction
    let sortDirection = "ascending";
    if (button.getAttribute("aria-sort") === "ascending") {
      sortDirection = "descending";
    }

    // Update button state
    button.setAttribute("aria-sort", sortDirection);
    button.classList.remove("sort-asc", "sort-desc");
    button.classList.add(
      sortDirection === "ascending" ? "sort-asc" : "sort-desc"
    );

    // Perform the sort
    rows.sort((rowA, rowB) => {
      let valueA, valueB;

      // Get the cell in each row that corresponds to the column we're sorting by
      const cellA = rowA.querySelector(
        `td:nth-child(${
          Array.from(button.closest("tr").children).indexOf(
            button.closest("th")
          ) + 1
        })`
      );
      const cellB = rowB.querySelector(
        `td:nth-child(${
          Array.from(button.closest("tr").children).indexOf(
            button.closest("th")
          ) + 1
        })`
      );

      // Use data-value attribute if available, otherwise use text content
      if (
        cellA.hasAttribute("data-value") &&
        cellB.hasAttribute("data-value")
      ) {
        valueA = cellA.getAttribute("data-value");
        valueB = cellB.getAttribute("data-value");

        // Convert to number if possible
        if (!isNaN(valueA) && !isNaN(valueB)) {
          valueA = Number(valueA);
          valueB = Number(valueB);
        }
      } else {
        valueA = cellA.textContent.trim();
        valueB = cellB.textContent.trim();
      }

      // Compare values
      if (valueA < valueB) {
        return sortDirection === "ascending" ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortDirection === "ascending" ? 1 : -1;
      }
      return 0;
    });

    // Update the DOM
    rows.forEach((row) => tbody.appendChild(row));

    // Announce sort to screen readers
    const liveRegion =
      document.getElementById("sort-announcement") || createLiveRegion();
    liveRegion.textContent = `Table sorted by ${button.textContent.trim()} in ${sortDirection} order`;
  });
});

// Helper function to create a live region for accessibility announcements
function createLiveRegion() {
  const region = document.createElement("div");
  region.id = "sort-announcement";
  region.setAttribute("aria-live", "polite");
  region.setAttribute("role", "status");
  region.className = "sr-only";
  document.body.appendChild(region);
  return region;
}

// Popover functionality for recommendation cells
const recommendationCells = document.querySelectorAll(".recommendation-cell");
let currentPopover = null;

// Create popover element
const popover = document.createElement("div");
popover.className = "popover";
popover.setAttribute("role", "dialog");
popover.setAttribute("aria-modal", "true");
popover.innerHTML =
  '<div class="popover-title"></div><div class="popover-content"></div>';
document.body.appendChild(popover);

// Helper function to show popover
function showPopover(cell, event) {
  const fullText = cell.getAttribute("data-full");
  const carModel = cell.parentNode.querySelector("td:first-child").textContent;

  // Set popover content
  popover.querySelector(".popover-title").textContent = carModel;
  popover.querySelector(".popover-content").textContent = fullText;

  // Show popover
  popover.classList.add("visible");

  // Position popover
  positionPopover(cell, event);

  // Store reference to current cell
  currentPopover = cell;

  // Announce to screen readers
  const liveRegion =
    document.getElementById("popover-announcement") ||
    createPopoverAnnouncement();
  liveRegion.textContent = `Showing full recommendation for ${carModel}: ${fullText}`;
}

// Helper function to position popover
function positionPopover(cell, event) {
  const rect = cell.getBoundingClientRect();
  const isMobile = window.innerWidth <= 768;

  // For touch devices, center the popover
  if (event && (event.type === "touchstart" || isMobile)) {
    const left = window.innerWidth / 2 - 150;
    const top = window.innerHeight / 2 - 100;
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    return;
  }

  // For mouse/keyboard, position near the cell
  let left = rect.left;
  let top = rect.bottom + 10;

  // Keep popover within viewport
  if (left + 300 > window.innerWidth) {
    left = window.innerWidth - 320;
  }

  if (top + 150 > window.innerHeight) {
    top = rect.top - 150;
  }

  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
}

// Helper function to hide popover
function hidePopover() {
  popover.classList.remove("visible");
  currentPopover = null;
}

// Create live region for popover announcements
function createPopoverAnnouncement() {
  const region = document.createElement("div");
  region.id = "popover-announcement";
  region.setAttribute("aria-live", "polite");
  region.setAttribute("role", "status");
  region.className = "sr-only";
  document.body.appendChild(region);
  return region;
}

// Add event listeners to recommendation cells
recommendationCells.forEach((cell) => {
  // Touch devices
  cell.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (currentPopover === cell) {
      hidePopover();
    } else {
      showPopover(cell, e);
    }
  });

  // Mouse
  cell.addEventListener("click", (e) => {
    e.preventDefault();
    showPopover(cell, e);
  });

  // Keyboard
  cell.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      showPopover(cell, e);
    }

    if (e.key === "Escape" && currentPopover) {
      hidePopover();
    }
  });
});

// Close popover when clicking outside
document.addEventListener("click", (e) => {
  if (
    currentPopover &&
    !e.target.closest(".recommendation-cell") &&
    !e.target.closest(".popover")
  ) {
    hidePopover();
  }
});

// Close popover with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && currentPopover) {
    hidePopover();
  }
});

// Handle scroll events
document.querySelector(".container").addEventListener("scroll", () => {
  if (currentPopover) {
    hidePopover();
  }
});

// Style the recommendation cells
recommendationCells.forEach((cell) => {
  cell.style.maxWidth = "250px";
  cell.style.whiteSpace = "nowrap";
  cell.style.overflow = "hidden";
  cell.style.textOverflow = "ellipsis";
  cell.style.display = "block";
  cell.style.cursor = "pointer";
});

// Make regular cells display their full content on keyboard focus
document
  .querySelectorAll('td[tabindex="0"]:not(.recommendation-cell)')
  .forEach((cell) => {
    cell.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        // Show title as alert for keyboard users
        const content = cell.getAttribute("title");
        const liveRegion =
          document.getElementById("cell-content-announcement") ||
          createCellContentAnnouncement();
        liveRegion.textContent = content;
      }
    });
  });

// Create live region for cell content announcements
function createCellContentAnnouncement() {
  const region = document.createElement("div");
  region.id = "cell-content-announcement";
  region.setAttribute("aria-live", "assertive");
  region.setAttribute("role", "alert");
  region.className = "sr-only";
  document.body.appendChild(region);
  return region;
}

// Track current cell for keyboard navigation
let currentCell = null;

// Add keyboard navigation between cells
const allCells = document.querySelectorAll('td[tabindex="0"], th button');

allCells.forEach((cell) => {
  // Set current cell on focus
  cell.addEventListener("focus", () => {
    // Remove current-cell class from any previous cell
    if (currentCell) {
      currentCell.classList.remove("current-cell");
      currentCell.classList.remove("focus-visible");
    }
    // Add to newly focused cell
    cell.classList.add("current-cell");
    currentCell = cell;
  });

  // Handle keyboard navigation
  cell.addEventListener("keydown", (e) => {
    // Add focus-visible class for keyboard users
    if (e.key === "Tab") {
      cell.classList.add("focus-visible");
    }

    // Only process navigation keys
    if (
      ![
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "PageUp",
        "PageDown",
      ].includes(e.key)
    ) {
      return;
    }

    e.preventDefault(); // Prevent scrolling

    let targetCell;
    const currentRow = cell.closest("tr");
    const table = cell.closest("table");
    const allRows = Array.from(table.querySelectorAll("tr"));
    const headerRow = table.querySelector("thead tr");
    const rowIndex = allRows.indexOf(currentRow);
    let cellIndex;

    if (cell.tagName === "BUTTON") {
      // For header buttons, get column index
      cellIndex = Array.from(headerRow.children).indexOf(cell.closest("th"));
    } else {
      // For data cells, get column index
      cellIndex = Array.from(currentRow.children).indexOf(cell);
    }

    switch (e.key) {
      case "ArrowUp":
        if (rowIndex > 0) {
          // If we're in a data row, go to the previous row
          targetCell = allRows[rowIndex - 1].children[cellIndex];
          // If we're going to the header row, target the button inside
          if (rowIndex === 1) {
            targetCell = targetCell.querySelector("button") || targetCell;
          }
        }
        break;
      case "ArrowDown":
        if (rowIndex < allRows.length - 1) {
          targetCell = allRows[rowIndex + 1].children[cellIndex];
          // If we're in the header row, target the cell directly
          if (rowIndex === 0) {
            targetCell = targetCell;
          }
        }
        break;
      case "ArrowLeft":
        if (cellIndex > 0) {
          if (rowIndex === 0) {
            // Header row
            targetCell =
              headerRow.children[cellIndex - 1].querySelector("button");
          } else {
            // Data row
            targetCell = currentRow.children[cellIndex - 1];
          }
        }
        break;
      case "ArrowRight":
        if (cellIndex < currentRow.children.length - 1) {
          if (rowIndex === 0) {
            // Header row
            targetCell =
              headerRow.children[cellIndex + 1].querySelector("button");
          } else {
            // Data row
            targetCell = currentRow.children[cellIndex + 1];
          }
        }
        break;
      case "Home":
        // Move to first cell in the row
        if (rowIndex === 0) {
          // Header row
          targetCell = headerRow.children[0].querySelector("button");
        } else {
          // Data row
          targetCell = currentRow.children[0];
        }
        break;
      case "End":
        // Move to last cell in the row
        if (rowIndex === 0) {
          // Header row
          targetCell =
            headerRow.children[headerRow.children.length - 1].querySelector(
              "button"
            );
        } else {
          // Data row
          targetCell = currentRow.children[currentRow.children.length - 1];
        }
        break;
      case "PageUp":
        // Move to first row (same column)
        if (rowIndex > 0) {
          if (rowIndex === 1) {
            // If in first data row, go to header
            targetCell = headerRow.children[cellIndex].querySelector("button");
          } else {
            // Go to first data row
            targetCell = allRows[1].children[cellIndex];
          }
        }
        break;
      case "PageDown":
        // Move to last row (same column)
        if (rowIndex < allRows.length - 1) {
          targetCell = allRows[allRows.length - 1].children[cellIndex];
        }
        break;
    }

    if (targetCell) {
      targetCell.focus();
      targetCell.classList.add("focus-visible");

      // Ensure the cell is visible by scrolling if necessary
      ensureCellVisible(targetCell);
    }
  });
});

// Ensure cell is visible within the container
function ensureCellVisible(cell) {
  const container = document.querySelector(".container");
  const rect = cell.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // Check if cell is outside the visible area horizontally
  if (rect.left < containerRect.left) {
    container.scrollLeft += rect.left - containerRect.left - 10;
  } else if (rect.right > containerRect.right) {
    container.scrollLeft += rect.right - containerRect.right + 10;
  }

  // Check if cell is outside the visible area vertically
  if (rect.top < containerRect.top) {
    container.scrollTop += rect.top - containerRect.top - 10;
  } else if (rect.bottom > containerRect.bottom) {
    container.scrollTop += rect.bottom - containerRect.bottom + 10;
  }
}

// Make all cells respond to being clicked (not just recommendation cells)
document
  .querySelectorAll('td[tabindex="0"]:not(.recommendation-cell)')
  .forEach((cell) => {
    cell.addEventListener("click", () => {
      // Show the full content when clicked
      const content = cell.getAttribute("title");
      const liveRegion =
        document.getElementById("cell-content-announcement") ||
        createCellContentAnnouncement();
      liveRegion.textContent = content;

      // Visual feedback
      cell.classList.add("focus-visible");
      setTimeout(() => {
        cell.classList.remove("focus-visible");
      }, 1000);
    });
  });

// Add touch swipe navigation for mobile users
let touchStartX = 0;
let touchStartY = 0;

document.querySelector(".container").addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  },
  false
);

document.querySelector(".container").addEventListener(
  "touchend",
  (e) => {
    // Don't process if popover is open
    if (currentPopover) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Only process if it's clearly a swipe, not a tap or scroll
    if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) return;

    // Find the current cell (the one user might have last interacted with)
    if (!currentCell) return;

    let direction = "";

    // Detect swipe direction
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      direction = diffX > 0 ? "ArrowRight" : "ArrowLeft";
    } else {
      // Vertical swipe
      direction = diffY > 0 ? "ArrowDown" : "ArrowUp";
    }

    // Simulate keyboard navigation
    const keyEvent = new KeyboardEvent("keydown", {
      key: direction,
      bubbles: true,
      cancelable: true,
    });

    currentCell.dispatchEvent(keyEvent);
  },
  false
);

// Show keyboard help when button is clicked
document
  .getElementById("show-keyboard-help")
  .addEventListener("click", showKeyboardHelp);

// Handle Ctrl+Alt+H shortcut for keyboard help
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.altKey && e.key === "h") {
    e.preventDefault();
    showKeyboardHelp();
  }
});

// Function to show keyboard help modal
function showKeyboardHelp() {
  // Create or show help modal
  let helpModal = document.getElementById("keyboard-help-modal");
  let overlay = document.querySelector(".modal-overlay");

  if (!helpModal) {
    // Create overlay
    overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    document.body.appendChild(overlay);

    // Create modal
    helpModal = document.createElement("div");
    helpModal.id = "keyboard-help-modal";
    helpModal.className = "modal";
    helpModal.setAttribute("role", "dialog");
    helpModal.setAttribute("aria-labelledby", "keyboard-help-title");
    helpModal.setAttribute("aria-modal", "true");

    // Create modal content
    helpModal.innerHTML = `
            <h2 id="keyboard-help-title">Keyboard Shortcuts</h2>
            <div class="shortcut"><span>Move up a cell</span><span><kbd class="key">↑</kbd></span></div>
            <div class="shortcut"><span>Move down a cell</span><span><kbd class="key">↓</kbd></span></div>
            <div class="shortcut"><span>Move left a cell</span><span><kbd class="key">←</kbd></span></div>
            <div class="shortcut"><span>Move right a cell</span><span><kbd class="key">→</kbd></span></div>
            <div class="shortcut"><span>First cell in row</span><span><kbd class="key">Home</kbd></span></div>
            <div class="shortcut"><span>Last cell in row</span><span><kbd class="key">End</kbd></span></div>
            <div class="shortcut"><span>First row (same column)</span><span><kbd class="key">Page Up</kbd></span></div>
            <div class="shortcut"><span>Last row (same column)</span><span><kbd class="key">Page Down</kbd></span></div>
            <div class="shortcut"><span>View cell content</span><span><kbd class="key">Enter</kbd> or <kbd class="key">Space</kbd></span></div>
            <div class="shortcut"><span>Close popup/dialog</span><span><kbd class="key">Esc</kbd></span></div>
            <div class="shortcut"><span>Sort column</span><span><kbd class="key">Enter</kbd> on header</span></div>
            <div class="shortcut"><span>Show this help</span><span><kbd class="key">Ctrl</kbd> + <kbd class="key">Alt</kbd> + <kbd class="key">H</kbd></span></div>
            <button id="close-help-modal">Close</button>
        `;

    document.body.appendChild(helpModal);

    // Focus trap & close button
    const closeButton = document.getElementById("close-help-modal");
    closeButton.focus();

    closeButton.addEventListener("click", () => {
      closeKeyboardHelp(helpModal, overlay);
    });

    overlay.addEventListener("click", () => {
      closeKeyboardHelp(helpModal, overlay);
    });
  } else {
    // Modal already exists, just show it again
    helpModal.style.display = "block";
    document.querySelector(".modal-overlay").style.display = "block";
    document.getElementById("close-help-modal").focus();
  }

  // Handle Escape key
  document.addEventListener("keydown", function escapeHandler(e) {
    if (e.key === "Escape") {
      closeKeyboardHelp(helpModal, overlay);
      document.removeEventListener("keydown", escapeHandler);
    }
  });
}

// Function to close keyboard help modal
function closeKeyboardHelp(modal, overlay) {
  if (modal) modal.style.display = "none";
  if (overlay) overlay.style.display = "none";

  // Return focus to the keyboard help button
  document.getElementById("show-keyboard-help").focus();
}

// Detect keyboard vs mouse usage
document.addEventListener("mousedown", () => {
  // User is using a mouse
  if (currentCell) {
    currentCell.classList.remove("focus-visible");
  }
});

// Add announcements for touch interaction
document.querySelector(".container").addEventListener(
  "focus",
  () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && !localStorage.getItem("swipeInstructionsGiven")) {
      const liveRegion = createLiveRegion();
      liveRegion.textContent =
        "You can navigate the table by swiping left, right, up or down. Tap on a cell to view its full content.";
      localStorage.setItem("swipeInstructionsGiven", "true");
    }
  },
  { once: true }
);

// Initialize first cell as current (for keyboard navigation)
const firstCell = document.querySelector("th button");
if (firstCell) {
  firstCell.classList.add("current-cell");
  currentCell = firstCell;
}

// Set initial text to help users know about keyboard navigation
setTimeout(() => {
  const helpRegion = createLiveRegion();
  helpRegion.textContent =
    "Table is fully navigable by keyboard. Press Ctrl+Alt+H for keyboard shortcuts.";
}, 2000);
