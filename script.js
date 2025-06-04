// Task Manager Application
class TaskManager {
  constructor() {
    this.tasks = this.loadTasks()
    this.currentFilter = "all"
    this.editingTaskId = null
    this.init()
  }

  init() {
    this.bindEvents()
    this.render()
    this.updateStats()
  }

  bindEvents() {
    // Task form submission
    document.getElementById("taskForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.addTask()
    })

    // Character counter for main input
    document.getElementById("taskInput").addEventListener("input", (e) => {
      this.updateCharCounter("charCount", e.target.value.length)
    })

    // Filter buttons
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.setFilter(e.target.dataset.filter)
      })
    })

    // Bulk actions
    document.getElementById("markAllComplete").addEventListener("click", () => {
      this.markAllComplete()
    })

    document.getElementById("clearCompleted").addEventListener("click", () => {
      this.clearCompleted()
    })

    // Modal events
    document.getElementById("modalClose").addEventListener("click", () => {
      this.closeModal()
    })

    document.getElementById("cancelEdit").addEventListener("click", () => {
      this.closeModal()
    })

    document.getElementById("modalOverlay").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        this.closeModal()
      }
    })

    // Edit form submission
    document.getElementById("editTaskForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.saveEdit()
    })

    // Character counter for edit input
    document.getElementById("editTaskInput").addEventListener("input", (e) => {
      this.updateCharCounter("editCharCount", e.target.value.length)
    })

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal()
      }
    })
  }

  addTask() {
    const input = document.getElementById("taskInput")
    const text = input.value.trim()

    if (!text) {
      this.showNotification("Please enter a task description", "error")
      return
    }

    const task = {
      id: Date.now().toString(),
      text: text,
      completed: false,
      priority: "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.tasks.unshift(task)
    this.saveTasks()
    this.render()
    this.updateStats()

    input.value = ""
    this.updateCharCounter("charCount", 0)

    this.showNotification("Task added successfully!", "success")
  }

  editTask(id) {
    const task = this.tasks.find((t) => t.id === id)
    if (!task) return

    this.editingTaskId = id

    document.getElementById("editTaskInput").value = task.text
    document.getElementById("taskPriority").value = task.priority
    this.updateCharCounter("editCharCount", task.text.length)

    this.openModal()
  }

  saveEdit() {
    const text = document.getElementById("editTaskInput").value.trim()
    const priority = document.getElementById("taskPriority").value

    if (!text) {
      this.showNotification("Please enter a task description", "error")
      return
    }

    const taskIndex = this.tasks.findIndex((t) => t.id === this.editingTaskId)
    if (taskIndex === -1) return

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      text: text,
      priority: priority,
      updatedAt: new Date().toISOString(),
    }

    this.saveTasks()
    this.render()
    this.updateStats()
    this.closeModal()

    this.showNotification("Task updated successfully!", "success")
  }

  deleteTask(id) {
    const taskElement = document.querySelector(`[data-task-id="${id}"]`)
    if (taskElement) {
      taskElement.classList.add("removing")

      setTimeout(() => {
        this.tasks = this.tasks.filter((task) => task.id !== id)
        this.saveTasks()
        this.render()
        this.updateStats()
        this.showNotification("Task deleted successfully!", "info")
      }, 300)
    }
  }

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id)
    if (task) {
      task.completed = !task.completed
      task.updatedAt = new Date().toISOString()
      this.saveTasks()
      this.render()
      this.updateStats()

      const message = task.completed ? "Task completed!" : "Task marked as active"
      this.showNotification(message, "success")
    }
  }

  markAllComplete() {
    const activeTasks = this.tasks.filter((task) => !task.completed)
    if (activeTasks.length === 0) {
      this.showNotification("No active tasks to complete", "info")
      return
    }

    this.tasks.forEach((task) => {
      if (!task.completed) {
        task.completed = true
        task.updatedAt = new Date().toISOString()
      }
    })

    this.saveTasks()
    this.render()
    this.updateStats()
    this.showNotification(`${activeTasks.length} tasks completed!`, "success")
  }

  clearCompleted() {
    const completedTasks = this.tasks.filter((task) => task.completed)
    if (completedTasks.length === 0) {
      this.showNotification("No completed tasks to clear", "info")
      return
    }

    this.tasks = this.tasks.filter((task) => !task.completed)
    this.saveTasks()
    this.render()
    this.updateStats()
    this.showNotification(`${completedTasks.length} completed tasks cleared!`, "info")
  }

  setFilter(filter) {
    this.currentFilter = filter

    // Update active filter button
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    document.querySelector(`[data-filter="${filter}"]`).classList.add("active")

    this.render()
  }

  getFilteredTasks() {
    switch (this.currentFilter) {
      case "active":
        return this.tasks.filter((task) => !task.completed)
      case "completed":
        return this.tasks.filter((task) => task.completed)
      default:
        return this.tasks
    }
  }

  render() {
    const taskList = document.getElementById("taskList")
    const emptyState = document.getElementById("emptyState")
    const filteredTasks = this.getFilteredTasks()

    if (filteredTasks.length === 0) {
      taskList.innerHTML = ""
      emptyState.classList.remove("hidden")

      // Update empty state message based on filter
      const emptyMessages = {
        all: "No tasks yet",
        active: "No active tasks",
        completed: "No completed tasks",
      }

      emptyState.querySelector("h3").textContent = emptyMessages[this.currentFilter]
    } else {
      emptyState.classList.add("hidden")
      taskList.innerHTML = filteredTasks.map((task) => this.createTaskHTML(task)).join("")

      // Bind events for task items
      this.bindTaskEvents()
    }
  }

  createTaskHTML(task) {
    const priorityClass = `priority-${task.priority}`
    const completedClass = task.completed ? "completed" : ""
    const checkIcon = task.completed ? '<i class="fas fa-check"></i>' : ""

    return `
            <div class="task-item ${completedClass} ${priorityClass}" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? "checked" : ""}" data-action="toggle">
                    ${checkIcon}
                </div>
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="priority-badge ${task.priority}">${task.priority}</span>
                        <span class="task-date">${this.formatDate(task.createdAt)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" data-action="edit" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-action="delete" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `
  }

  bindTaskEvents() {
    document.querySelectorAll(".task-item").forEach((item) => {
      const taskId = item.dataset.taskId

      // Toggle task completion
      item.querySelector('[data-action="toggle"]').addEventListener("click", () => {
        this.toggleTask(taskId)
      })

      // Edit task
      item.querySelector('[data-action="edit"]').addEventListener("click", () => {
        this.editTask(taskId)
      })

      // Delete task
      item.querySelector('[data-action="delete"]').addEventListener("click", () => {
        this.deleteTask(taskId)
      })
    })
  }

  updateStats() {
    const total = this.tasks.length
    const completed = this.tasks.filter((task) => task.completed).length
    const active = total - completed

    document.getElementById("totalTasks").textContent = total
    document.getElementById("activeTasks").textContent = active
    document.getElementById("completedTasks").textContent = completed
  }

  openModal() {
    document.getElementById("modalOverlay").classList.add("active")
    document.body.style.overflow = "hidden"

    // Focus on the edit input
    setTimeout(() => {
      document.getElementById("editTaskInput").focus()
    }, 100)
  }

  closeModal() {
    document.getElementById("modalOverlay").classList.remove("active")
    document.body.style.overflow = ""
    this.editingTaskId = null
  }

  updateCharCounter(counterId, length) {
    document.getElementById(counterId).textContent = length
  }

  showNotification(message, type = "info") {
    const notification = document.getElementById("notification")
    const messageEl = notification.querySelector(".notification-message")
    const iconEl = notification.querySelector(".notification-icon")

    // Set message and type
    messageEl.textContent = message
    notification.className = `notification ${type}`

    // Set appropriate icon
    const icons = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      info: "fas fa-info-circle",
    }
    iconEl.className = `notification-icon ${icons[type]}`

    // Show notification
    notification.classList.add("show")

    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove("show")
    }, 3000)
  }

  formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return "Today"
    } else if (diffDays === 2) {
      return "Yesterday"
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  saveTasks() {
    localStorage.setItem("taskmaster-tasks", JSON.stringify(this.tasks))
  }

  loadTasks() {
    const saved = localStorage.getItem("taskmaster-tasks")
    return saved ? JSON.parse(saved) : []
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TaskManager()
})

// Service Worker registration for offline functionality (optional)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration)
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError)
      })
  })
}

// Product Data
const products = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    category: "smartphones",
    brand: "Apple",
    price: 1199,
    originalPrice: 1299,
    image: "/placeholder.svg?height=300&width=300",
    images: [
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
    ],
    rating: 4.8,
    reviews: 1247,
    description: "The most advanced iPhone ever with titanium design, A17 Pro chip, and revolutionary camera system.",
    features: [
      "6.7-inch Super Retina XDR display",
      "A17 Pro chip with 6-core GPU",
      "Pro camera system with 48MP main",
      "Up to 29 hours video playback",
      "Titanium design",
    ],
    sku: "IPH15PM-256-NT",
    stock: "In Stock",
    badge: "new",
  },
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    category: "smartphones",
    brand: "Samsung",
    price: 1099,
    originalPrice: 1199,
    image: "/placeholder.svg?height=300&width=300",
    images: [
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
    ],
    rating: 4.7,
    reviews: 892,
    description: "Ultimate productivity powerhouse with S Pen, advanced AI features, and stunning 200MP camera.",
    features: [
      "6.8-inch Dynamic AMOLED 2X",
      "Snapdragon 8 Gen 3 processor",
      "200MP quad camera system",
      "S Pen included",
      "5000mAh battery",
    ],
    sku: "SGS24U-512-BK",
    stock: "In Stock",
    badge: "sale",
  },
  {
    id: 3,
    name: "MacBook Pro 16-inch M3",
    category: "laptops",
    brand: "Apple",
    price: 2499,
    originalPrice: 2699,
    image: "/placeholder.svg?height=300&width=300",
    images: [
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
    ],
    rating: 4.9,
    reviews: 567,
    description: "Supercharged for pros with M3 chip, stunning Liquid Retina XDR display, and all-day battery life.",
    features: [
      "16-inch Liquid Retina XDR display",
      "Apple M3 chip with 10-core CPU",
      "18-core GPU",
      "Up to 22 hours battery life",
      "1080p FaceTime HD camera",
    ],
    sku: "MBP16-M3-512-SG",
    stock: "In Stock",
    badge: "new",
  },
  {
    id: 4,
    name: "Dell XPS 13 Plus",
    category: "laptops",
    brand: "Dell",
    price: 1299,
    originalPrice: 1499,
    image: "/placeholder.svg?height=300&width=300",
    images: [
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
    ],
    rating: 4.6,
    reviews: 423,
    description: "Premium ultrabook with stunning design, powerful performance, and innovative touch function row.",
    features: [
      "13.4-inch InfinityEdge display",
      "12th Gen Intel Core i7",
      "16GB LPDDR5 RAM",
      "512GB PCIe SSD",
      "Touch Function Row",
    ],
    sku: "XPS13P-I7-16-512",
    stock: "Limited Stock",
    badge: "sale",
  },
  {
    id: 5,
    name: "Sony WH-1000XM5",
    category: "headphones",
    brand: "Sony",
    price: 349,
    originalPrice: 399,
    image: "/placeholder.svg?height=300&width=300",
    images: [
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
    ],
    rating: 4.8,
    reviews: 2156,
    description: "Industry-leading noise canceling with exceptional sound quality and all-day comfort.",
    features: [
      "Industry-leading noise canceling",
      "30-hour battery life",
      "Quick Charge (3 min = 3 hours)",
      "Multipoint connection",
      "Touch sensor controls",
    ],
    sku: "WH1000XM5-BK",
    stock: "In Stock",
    badge: "sale",
  },
  {
    id: 6,
    name: "AirPods Pro (2nd Gen)",
    category: "headphones",
    brand: "Apple",
    price: 249,
    originalPrice: 279,
    image: "/placeholder.svg?height=300&width=300",
    images: [
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
    ],
    rating: 4.7,
    reviews: 3421,
    description: "Rebuilt from the ground up with Apple's H2 chip for smarter noise cancellation and immersive sound.",
    features: [
      "Active Noise Cancellation",
      "Adaptive Transparency",
      "Spatial Audio",
      "Up to 6 hours listening time",
      "MagSafe charging case",
    ],
    sku: "APP2-USB-C",
    stock: "In Stock",
    badge: "new",
  },
  {
    id: 7,
    name: "iPad Pro 12.9-inch M2",
    category: "accessories",
    brand: "Apple",
    price: 1099,
    originalPrice: 1199,
    image: "/placeholder.svg?height=300&width=300",
    images: [
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
    ],
    rating: 4.8,
    reviews: 892,
    description: "The ultimate iPad experience with M2 chip, Liquid Retina XDR display, and Apple Pencil support.",
    features: [
      "12.9-inch Liquid Retina XDR",
      "Apple M2 chip",
      "12MP Ultra Wide front camera",
      "Apple Pencil (2nd gen) support",
      "Thunderbolt / USB 4",
    ],
    sku: "IPADPRO12-M2-256",
    stock: "In Stock",
    badge: "sale",
  },
  {
    id: 8,
    name: "Magic Keyboard for iPad Pro",
    category: "accessories",
    brand: "Apple",
    price: 349,
    originalPrice: 379,
    image: "/placeholder.svg?height=300&width=300",
    images: [
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
    ],
    rating: 4.5,
    reviews: 567,
    description: "Perfect companion for iPad Pro with backlit keys, trackpad, and USB-C pass-through charging.",
    features: [
      "Backlit keys",
      "Multi-Touch trackpad",
      "USB-C pass-through charging",
      "Floating cantilever design",
      "Full-size keyboard",
    ],
    sku: "MKBD-IPADPRO-12",
    stock: "In Stock",
  },
]

// Application State
let currentPage = "home"
let cart = JSON.parse(localStorage.getItem("cart")) || []
let currentProduct = null
let filteredProducts = [...products]

// DOM Elements
const pages = document.querySelectorAll(".page")
const cartCount = document.getElementById("cartCount")
const productsGrid = document.getElementById("productsGrid")
const noProducts = document.getElementById("noProducts")
const hamburger = document.getElementById("hamburger")
const navMenu = document.querySelector(".nav-menu")

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount()
  renderProducts()
  bindEvents()
})

// Event Bindings
function bindEvents() {
  // Mobile menu toggle
  hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("active")
    hamburger.classList.toggle("active")
  })

  // Close mobile menu when clicking on a link
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active")
      hamburger.classList.remove("active")
    })
  })

  // Search functionality
  document.getElementById("searchInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchProducts()
    }
  })

  // Checkout form submission
  document.getElementById("checkoutForm").addEventListener("submit", (e) => {
    e.preventDefault()
    processOrder()
  })

  // Payment method toggle
  document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const cardDetails = document.getElementById("cardDetails")
      if (e.target.value === "card") {
        cardDetails.style.display = "block"
      } else {
        cardDetails.style.display = "none"
      }
    })
  })
}

// Page Navigation
function showPage(pageId) {
  // Hide all pages
  pages.forEach((page) => {
    page.classList.remove("active")
  })

  // Show selected page
  document.getElementById(pageId + "Page").classList.add("active")
  currentPage = pageId

  // Update page-specific content
  if (pageId === "cart") {
    renderCart()
  } else if (pageId === "checkout") {
    renderCheckout()
  }

  // Scroll to top
  window.scrollTo(0, 0)
}

// Product Functions
function renderProducts(productsToRender = filteredProducts) {
  if (productsToRender.length === 0) {
    productsGrid.style.display = "none"
    noProducts.style.display = "block"
    return
  }

  productsGrid.style.display = "grid"
  noProducts.style.display = "none"

  productsGrid.innerHTML = productsToRender
    .map(
      (product) => `
    <div class="product-card" onclick="showProductDetails(${product.id})">
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" />
        ${product.badge ? `<div class="product-badge ${product.badge}">${product.badge}</div>` : ""}
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.name}</h3>
        <div class="product-rating">
          <div class="stars">${generateStars(product.rating)}</div>
          <span class="rating-text">(${product.reviews})</span>
        </div>
        <div class="product-price">
          <span class="current-price">$${product.price}</span>
          ${product.originalPrice ? `<span class="original-price">$${product.originalPrice}</span>` : ""}
          ${product.originalPrice ? `<span class="discount">-${Math.round((1 - product.price / product.originalPrice) * 100)}%</span>` : ""}
        </div>
        <div class="product-actions">
          <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${product.id})">
            <i class="fas fa-shopping-cart"></i>
            Add to Cart
          </button>
          <button class="wishlist-btn" onclick="event.stopPropagation(); addToWishlist(${product.id})">
            <i class="fas fa-heart"></i>
          </button>
        </div>
      </div>
    </div>
  `,
    )
    .join("")
}

function generateStars(rating) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0
  let stars = ""

  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star"></i>'
  }

  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt"></i>'
  }

  const emptyStars = 5 - Math.ceil(rating)
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star"></i>'
  }

  return stars
}

function showProductDetails(productId) {
  currentProduct = products.find((p) => p.id === productId)
  if (!currentProduct) return

  // Update breadcrumb
  document.getElementById("productBreadcrumb").textContent = currentProduct.name

  // Update product details
  document.getElementById("productMainImage").src = currentProduct.images[0]
  document.getElementById("productTitle").textContent = currentProduct.name
  document.getElementById("productStars").innerHTML = generateStars(currentProduct.rating)
  document.getElementById("productReviews").textContent = `(${currentProduct.reviews} reviews)`
  document.getElementById("productPrice").textContent = `$${currentProduct.price}`

  if (currentProduct.originalPrice) {
    document.getElementById("productOriginalPrice").textContent = `$${currentProduct.originalPrice}`
    document.getElementById("productOriginalPrice").style.display = "inline"
    document.getElementById("productDiscount").textContent =
      `-${Math.round((1 - currentProduct.price / currentProduct.originalPrice) * 100)}%`
    document.getElementById("productDiscount").style.display = "inline"
  } else {
    document.getElementById("productOriginalPrice").style.display = "none"
    document.getElementById("productDiscount").style.display = "none"
  }

  document.getElementById("productDescription").textContent = currentProduct.description
  document.getElementById("productFeatures").innerHTML = currentProduct.features
    .map((feature) => `<li>${feature}</li>`)
    .join("")
  document.getElementById("productSku").textContent = currentProduct.sku
  document.getElementById("productCategory").textContent = currentProduct.category
  document.getElementById("productBrand").textContent = currentProduct.brand
  document.getElementById("productStock").textContent = currentProduct.stock

  // Update thumbnails
  const thumbnailsContainer = document.getElementById("productThumbnails")
  thumbnailsContainer.innerHTML = currentProduct.images
    .map(
      (image, index) => `
    <div class="thumbnail ${index === 0 ? "active" : ""}" onclick="changeMainImage('${image}', this)">
      <img src="${image}" alt="Product thumbnail" />
    </div>
  `,
    )
    .join("")

  showPage("product")
}

function changeMainImage(imageSrc, thumbnailElement) {
  document.getElementById("productMainImage").src = imageSrc

  // Update active thumbnail
  document.querySelectorAll(".thumbnail").forEach((thumb) => thumb.classList.remove("active"))
  thumbnailElement.classList.add("active")
}

function increaseQuantity() {
  const quantityInput = document.getElementById("productQuantity")
  const currentValue = Number.parseInt(quantityInput.value)
  if (currentValue < 10) {
    quantityInput.value = currentValue + 1
  }
}

function decreaseQuantity() {
  const quantityInput = document.getElementById("productQuantity")
  const currentValue = Number.parseInt(quantityInput.value)
  if (currentValue > 1) {
    quantityInput.value = currentValue - 1
  }
}

function addToCartFromDetails() {
  const quantity = Number.parseInt(document.getElementById("productQuantity").value)
  addToCart(currentProduct.id, quantity)
}

// Filter and Search Functions
function filterProducts(category) {
  if (category === "all") {
    filteredProducts = [...products]
  } else {
    filteredProducts = products.filter((product) => product.category === category)
  }
  renderProducts()
  showPage("home")

  // Scroll to products section
  setTimeout(() => {
    document.getElementById("products").scrollIntoView({ behavior: "smooth" })
  }, 100)
}

function showAllProducts() {
  filteredProducts = [...products]
  renderProducts()
  document.getElementById("sortSelect").value = "default"
}

function sortProducts() {
  const sortValue = document.getElementById("sortSelect").value

  switch (sortValue) {
    case "price-low":
      filteredProducts.sort((a, b) => a.price - b.price)
      break
    case "price-high":
      filteredProducts.sort((a, b) => b.price - a.price)
      break
    case "name":
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name))
      break
    case "rating":
      filteredProducts.sort((a, b) => b.rating - a.rating)
      break
    default:
      filteredProducts = [...products]
  }

  renderProducts()
}

function searchProducts() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase().trim()

  if (searchTerm === "") {
    filteredProducts = [...products]
  } else {
    filteredProducts = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm),
    )
  }

  renderProducts()
  showPage("home")

  // Scroll to products section
  setTimeout(() => {
    document.getElementById("products").scrollIntoView({ behavior: "smooth" })
  }, 100)
}

// Cart Functions
function addToCart(productId, quantity = 1) {
  const product = products.find((p) => p.id === productId)
  if (!product) return

  const existingItem = cart.find((item) => item.id === productId)

  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    cart.push({
      ...product,
      quantity: quantity,
    })
  }

  updateCartCount()
  saveCart()
  showNotification(`${product.name} added to cart!`, "success")
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId)
  updateCartCount()
  saveCart()
  renderCart()
  showNotification("Item removed from cart", "info")
}

function updateCartQuantity(productId, newQuantity) {
  const item = cart.find((item) => item.id === productId)
  if (item) {
    if (newQuantity <= 0) {
      removeFromCart(productId)
    } else {
      item.quantity = newQuantity
      updateCartCount()
      saveCart()
      renderCart()
    }
  }
}

function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  cartCount.textContent = totalItems
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart))
}

function renderCart() {
  const cartItems = document.getElementById("cartItems")
  const cartEmpty = document.getElementById("cartEmpty")
  const cartSummary = document.getElementById("cartSummary")

  if (cart.length === 0) {
    cartItems.style.display = "none"
    cartSummary.style.display = "none"
    cartEmpty.style.display = "block"
    return
  }

  cartEmpty.style.display = "none"
  cartItems.style.display = "block"
  cartSummary.style.display = "block"

  cartItems.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="cart-item-image">
        <img src="${item.image}" alt="${item.name}" />
      </div>
      <div class="cart-item-info">
        <h3>${item.name}</h3>
        <p>${item.brand} • ${item.category}</p>
      </div>
      <div class="cart-item-price">$${item.price}</div>
      <div class="cart-item-quantity">
        <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
        <span>${item.quantity}</span>
        <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `,
    )
    .join("")

  updateCartSummary()
}

function updateCartSummary() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 100 ? 0 : 15
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  document.getElementById("cartSubtotal").textContent = `$${subtotal.toFixed(2)}`
  document.getElementById("cartShipping").textContent = shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`
  document.getElementById("cartTax").textContent = `$${tax.toFixed(2)}`
  document.getElementById("cartTotal").textContent = `$${total.toFixed(2)}`
}

// Checkout Functions
function renderCheckout() {
  const checkoutItems = document.getElementById("checkoutItems")
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 100 ? 0 : 15
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  checkoutItems.innerHTML = cart
    .map(
      (item) => `
    <div class="order-item">
      <div class="order-item-image">
        <img src="${item.image}" alt="${item.name}" />
      </div>
      <div class="order-item-info">
        <h4>${item.name}</h4>
        <p>Qty: ${item.quantity}</p>
      </div>
      <div class="order-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
    </div>
  `,
    )
    .join("")

  document.getElementById("checkoutSubtotal").textContent = `$${subtotal.toFixed(2)}`
  document.getElementById("checkoutShipping").textContent = shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`
  document.getElementById("checkoutTax").textContent = `$${tax.toFixed(2)}`
  document.getElementById("checkoutTotal").textContent = `$${total.toFixed(2)}`
}

function processOrder() {
  // Simulate order processing
  const orderNumber = "ORD-" + Date.now()
  const total = document.getElementById("checkoutTotal").textContent

  // Show success modal
  document.getElementById("orderNumber").textContent = orderNumber
  document.getElementById("orderTotal").textContent = total
  document.getElementById("successModal").classList.add("active")

  // Clear cart
  cart = []
  updateCartCount()
  saveCart()
}

function closeSuccessModal() {
  document.getElementById("successModal").classList.remove("active")
  showPage("home")
}

// Utility Functions
function addToWishlist(productId) {
  const product = products.find((p) => p.id === productId)
  if (product) {
    showNotification(`${product.name} added to wishlist!`, "info")
  }
}

function showNotification(message, type = "info") {
  const notification = document.getElementById("notification")
  const icon = notification.querySelector(".notification-icon")
  const messageEl = notification.querySelector(".notification-message")

  // Set icon based on type
  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    info: "fas fa-info-circle",
  }

  icon.className = `notification-icon ${icons[type]}`
  messageEl.textContent = message

  // Show notification
  notification.classList.add("show")

  // Hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show")
  }, 3000)
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

// Smooth scroll to element
function scrollToElement(elementId) {
  const element = document.getElementById(elementId)
  if (element) {
    element.scrollIntoView({ behavior: "smooth" })
  }
}

// Initialize tooltips and other interactive elements
function initializeInteractiveElements() {
  // Add loading states to buttons
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      if (!this.classList.contains("loading")) {
        this.classList.add("loading")
        setTimeout(() => {
          this.classList.remove("loading")
        }, 1000)
      }
    })
  })

  // Add hover effects to product cards
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-5px)"
    })

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)"
    })
  })
}

// Call initialization function when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeInteractiveElements)

// Weather Dashboard Application
class WeatherDashboard {
  constructor() {
    this.apiKey = localStorage.getItem("weatherApiKey") || null
    this.isMetric = localStorage.getItem("isMetric") !== "false"
    this.recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || []
    this.currentLocation = null
    this.demoMode = false

    this.init()
  }

  init() {
    this.bindEvents()
    this.updateUnitToggle()
    this.renderRecentSearches()

    // Check if API key exists, otherwise show modal
    if (!this.apiKey) {
      this.showApiKeyModal()
    } else {
      this.loadDefaultLocation()
    }
  }

  bindEvents() {
    // Search functionality
    document.getElementById("searchBtn").addEventListener("click", () => {
      this.searchWeather()
    })

    document.getElementById("searchInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.searchWeather()
      }
    })

    // Current location
    document.getElementById("currentLocationBtn").addEventListener("click", () => {
      this.getCurrentLocation()
    })

    // Unit toggle
    document.getElementById("unitToggle").addEventListener("click", () => {
      this.toggleUnits()
    })

    // Retry button
    document.getElementById("retryBtn").addEventListener("click", () => {
      this.retryLastSearch()
    })
  }

  // API Key Management
  showApiKeyModal() {
    document.getElementById("apiKeyModal").classList.add("show")
  }

  closeApiKeyModal() {
    document.getElementById("apiKeyModal").classList.remove("show")
  }

  saveApiKey() {
    const apiKey = document.getElementById("apiKeyInput").value.trim()
    if (apiKey) {
      this.apiKey = apiKey
      localStorage.setItem("weatherApiKey", apiKey)
      this.closeApiKeyModal()
      this.loadDefaultLocation()
      this.showNotification("API key saved successfully!", "success")
    } else {
      this.showNotification("Please enter a valid API key", "error")
    }
  }

  useDemoMode() {
    this.demoMode = true
    this.closeApiKeyModal()
    this.loadDemoData()
    this.showNotification("Demo mode activated", "info")
  }

  // Weather Data Fetching
  async fetchWeatherData(query) {
    if (this.demoMode) {
      return this.getDemoWeatherData(query)
    }

    try {
      const units = this.isMetric ? "metric" : "imperial"

      // Current weather
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${this.apiKey}&units=${units}`,
      )

      if (!currentResponse.ok) {
        throw new Error("Location not found")
      }

      const currentData = await currentResponse.json()

      // 5-day forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${query}&appid=${this.apiKey}&units=${units}`,
      )

      const forecastData = await forecastResponse.json()

      return {
        current: currentData,
        forecast: forecastData,
      }
    } catch (error) {
      throw new Error(error.message || "Failed to fetch weather data")
    }
  }

  async fetchWeatherByCoords(lat, lon) {
    if (this.demoMode) {
      return this.getDemoWeatherData("Current Location")
    }

    try {
      const units = this.isMetric ? "metric" : "imperial"

      // Current weather
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${units}`,
      )

      const currentData = await currentResponse.json()

      // 5-day forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${units}`,
      )

      const forecastData = await forecastResponse.json()

      return {
        current: currentData,
        forecast: forecastData,
      }
    } catch (error) {
      throw new Error("Failed to fetch weather data")
    }
  }

  // Demo Data
  getDemoWeatherData(location) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          current: {
            name: location.includes("Current") ? "New York" : location,
            sys: { country: "US", sunrise: 1701677520, sunset: 1701712080 },
            main: {
              temp: this.isMetric ? 22 : 72,
              feels_like: this.isMetric ? 25 : 77,
              temp_min: this.isMetric ? 18 : 64,
              temp_max: this.isMetric ? 28 : 82,
              humidity: 65,
              pressure: 1013,
            },
            weather: [
              {
                main: "Clouds",
                description: "partly cloudy",
                icon: "02d",
              },
            ],
            wind: {
              speed: this.isMetric ? 12 : 7.5,
              deg: 45,
            },
            visibility: 10000,
            dt: Date.now() / 1000,
          },
          forecast: {
            list: this.generateDemoForecast(),
          },
        })
      }, 1000)
    })
  }

  generateDemoForecast() {
    const forecast = []
    const conditions = [
      { main: "Clear", description: "clear sky", icon: "01d" },
      { main: "Clouds", description: "few clouds", icon: "02d" },
      { main: "Rain", description: "light rain", icon: "10d" },
      { main: "Clouds", description: "scattered clouds", icon: "03d" },
      { main: "Clear", description: "clear sky", icon: "01d" },
    ]

    for (let i = 0; i < 40; i++) {
      const date = new Date()
      date.setHours(date.getHours() + i * 3)

      const conditionIndex = Math.floor(i / 8) % conditions.length
      const baseTemp = this.isMetric ? 20 : 68
      const tempVariation = Math.sin(i * 0.5) * 8

      forecast.push({
        dt: date.getTime() / 1000,
        main: {
          temp: baseTemp + tempVariation,
          humidity: 60 + Math.random() * 20,
        },
        weather: [conditions[conditionIndex]],
        wind: {
          speed: this.isMetric ? 8 + Math.random() * 8 : 5 + Math.random() * 5,
        },
        dt_txt: date.toISOString(),
      })
    }

    return forecast
  }

  // Search and Location
  async searchWeather() {
    const query = document.getElementById("searchInput").value.trim()
    if (!query) {
      this.showNotification("Please enter a location", "error")
      return
    }

    this.showLoading()

    try {
      const data = await this.fetchWeatherData(query)
      this.displayWeatherData(data)
      this.addToRecentSearches(query)
      this.currentLocation = query
    } catch (error) {
      this.showError(error.message)
    }
  }

  async getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showNotification("Geolocation is not supported by this browser", "error")
      return
    }

    this.showLoading()

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const data = await this.fetchWeatherByCoords(latitude, longitude)
          this.displayWeatherData(data)
          this.currentLocation = "Current Location"
        } catch (error) {
          this.showError(error.message)
        }
      },
      (error) => {
        this.showError("Unable to retrieve your location")
      },
    )
  }

  async loadDefaultLocation() {
    this.showLoading()
    try {
      const data = await this.fetchWeatherData("New York")
      this.displayWeatherData(data)
      this.currentLocation = "New York"
    } catch (error) {
      this.showError(error.message)
    }
  }

  loadDemoData() {
    this.showLoading()
    setTimeout(async () => {
      try {
        const data = await this.getDemoWeatherData("New York")
        this.displayWeatherData(data)
        this.currentLocation = "New York"
      } catch (error) {
        this.showError(error.message)
      }
    }, 1000)
  }

  retryLastSearch() {
    if (this.currentLocation) {
      if (this.currentLocation === "Current Location") {
        this.getCurrentLocation()
      } else {
        document.getElementById("searchInput").value = this.currentLocation
        this.searchWeather()
      }
    } else {
      this.loadDefaultLocation()
    }
  }

  // Display Functions
  displayWeatherData(data) {
    const { current, forecast } = data

    this.hideLoading()
    this.hideError()
    this.showWeatherDashboard()

    // Current weather
    this.displayCurrentWeather(current)

    // Weather details
    this.displayWeatherDetails(current)

    // Hourly forecast
    this.displayHourlyForecast(forecast.list.slice(0, 8))

    // 5-day forecast
    this.display5DayForecast(forecast.list)

    // Additional info
    this.displayAdditionalInfo(current)

    // Clear search input
    document.getElementById("searchInput").value = ""
  }

  displayCurrentWeather(data) {
    const location = `${data.name}, ${data.sys.country}`
    const date = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    document.getElementById("currentLocation").textContent = location
    document.getElementById("currentDate").textContent = date
    document.getElementById("currentTemp").textContent = `${Math.round(data.main.temp)}°`
    document.getElementById("feelsLike").textContent = `${Math.round(data.main.feels_like)}°`
    document.getElementById("tempHigh").textContent = `${Math.round(data.main.temp_max)}°`
    document.getElementById("tempLow").textContent = `${Math.round(data.main.temp_min)}°`
    document.getElementById("weatherCondition").textContent = data.weather[0].main
    document.getElementById("weatherDescription").textContent = this.capitalizeWords(data.weather[0].description)

    // Weather icon
    const iconUrl = this.demoMode
      ? "/placeholder.svg?height=100&width=100"
      : `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
    document.getElementById("currentWeatherIcon").src = iconUrl
  }

  displayWeatherDetails(data) {
    const windDirection = this.getWindDirection(data.wind.deg)
    const windSpeedUnit = this.isMetric ? "km/h" : "mph"
    const visibilityUnit = this.isMetric ? "km" : "mi"
    const visibility = this.isMetric ? data.visibility / 1000 : data.visibility / 1609.34

    document.getElementById("visibility").textContent = `${visibility.toFixed(1)} ${visibilityUnit}`
    document.getElementById("humidity").textContent = `${data.main.humidity}%`
    document.getElementById("windSpeed").textContent = `${Math.round(data.wind.speed)} ${windSpeedUnit}`
    document.getElementById("windDirection").textContent = windDirection
    document.getElementById("pressure").textContent = `${data.main.pressure} hPa`
    document.getElementById("uvIndex").textContent = "5" // Demo value
  }

  displayHourlyForecast(hourlyData) {
    const hourlyList = document.getElementById("hourlyList")
    hourlyList.innerHTML = ""

    hourlyData.forEach((item) => {
      const time = new Date(item.dt * 1000).toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      })

      const iconUrl = this.demoMode
        ? "/placeholder.svg?height=40&width=40"
        : `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`

      const hourlyItem = document.createElement("div")
      hourlyItem.className = "hourly-item"
      hourlyItem.innerHTML = `
        <div class="hourly-time">${time}</div>
        <img src="${iconUrl}" alt="${item.weather[0].description}" class="hourly-icon">
        <div class="hourly-temp">${Math.round(item.main.temp)}°</div>
        <div class="hourly-desc">${item.weather[0].main}</div>
      `

      hourlyList.appendChild(hourlyItem)
    })
  }

  display5DayForecast(forecastData) {
    const forecastGrid = document.getElementById("forecastGrid")
    forecastGrid.innerHTML = ""

    // Group forecast data by day
    const dailyData = this.groupForecastByDay(forecastData)

    dailyData.slice(0, 5).forEach((day) => {
      const date = new Date(day.dt * 1000)
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" })
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })

      const iconUrl = this.demoMode
        ? "/placeholder.svg?height=60&width=60"
        : `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`

      const windSpeedUnit = this.isMetric ? "km/h" : "mph"

      const forecastCard = document.createElement("div")
      forecastCard.className = "forecast-card"
      forecastCard.innerHTML = `
        <div class="forecast-day">${dayName}</div>
        <div class="forecast-date">${dateStr}</div>
        <img src="${iconUrl}" alt="${day.weather[0].description}" class="forecast-icon">
        <div class="forecast-temps">
          <span class="forecast-high">${Math.round(day.temp_max)}°</span>
          <span class="forecast-low">${Math.round(day.temp_min)}°</span>
        </div>
        <div class="forecast-desc">${this.capitalizeWords(day.weather[0].description)}</div>
        <div class="forecast-details">
          <span><i class="fas fa-tint"></i> ${day.humidity}%</span>
          <span><i class="fas fa-wind"></i> ${Math.round(day.wind_speed)} ${windSpeedUnit}</span>
        </div>
      `

      forecastGrid.appendChild(forecastCard)
    })
  }

  displayAdditionalInfo(data) {
    const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

    const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

    document.getElementById("sunrise").textContent = sunrise
    document.getElementById("sunset").textContent = sunset

    // Demo AQI data
    document.getElementById("aqiValue").textContent = "42"
    document.getElementById("aqiLabel").textContent = "Good"
    document.getElementById("aqiDescription").textContent = "Air quality is satisfactory for most people."
  }

  // Utility Functions
  groupForecastByDay(forecastData) {
    const grouped = {}

    forecastData.forEach((item) => {
      const date = new Date(item.dt * 1000).toDateString()

      if (!grouped[date]) {
        grouped[date] = {
          dt: item.dt,
          temp_max: item.main.temp,
          temp_min: item.main.temp,
          weather: item.weather,
          humidity: item.main.humidity,
          wind_speed: item.wind.speed,
          items: [],
        }
      }

      grouped[date].temp_max = Math.max(grouped[date].temp_max, item.main.temp)
      grouped[date].temp_min = Math.min(grouped[date].temp_min, item.main.temp)
      grouped[date].items.push(item)
    })

    return Object.values(grouped)
  }

  getWindDirection(degrees) {
    const directions = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ]
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }

  capitalizeWords(str) {
    return str.replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Unit Management
  toggleUnits() {
    this.isMetric = !this.isMetric
    localStorage.setItem("isMetric", this.isMetric)
    this.updateUnitToggle()

    if (this.currentLocation) {
      this.retryLastSearch()
    }
  }

  updateUnitToggle() {
    const unitLabel = document.querySelector(".unit-label")
    unitLabel.textContent = this.isMetric ? "°C" : "°F"
  }

  // Recent Searches
  addToRecentSearches(location) {
    // Remove if already exists
    this.recentSearches = this.recentSearches.filter((item) => item.toLowerCase() !== location.toLowerCase())

    // Add to beginning
    this.recentSearches.unshift(location)

    // Keep only last 5
    this.recentSearches = this.recentSearches.slice(0, 5)

    localStorage.setItem("recentSearches", JSON.stringify(this.recentSearches))
    this.renderRecentSearches()
  }

  renderRecentSearches() {
    const recentList = document.getElementById("recentList")
    const recentSearchesContainer = document.getElementById("recentSearches")

    if (this.recentSearches.length === 0) {
      recentSearchesContainer.style.display = "none"
      return
    }

    recentSearchesContainer.style.display = "block"
    recentList.innerHTML = ""

    this.recentSearches.forEach((location) => {
      const item = document.createElement("div")
      item.className = "recent-item"
      item.textContent = location
      item.addEventListener("click", () => {
        document.getElementById("searchInput").value = location
        this.searchWeather()
      })
      recentList.appendChild(item)
    })
  }

  // UI State Management
  showLoading() {
    document.getElementById("loadingState").classList.add("show")
    document.getElementById("errorState").classList.remove("show")
    document.getElementById("weatherDashboard").classList.remove("show")
  }

  hideLoading() {
    document.getElementById("loadingState").classList.remove("show")
  }

  showError(message) {
    document.getElementById("errorMessage").textContent = message
    document.getElementById("errorState").classList.add("show")
    document.getElementById("loadingState").classList.remove("show")
    document.getElementById("weatherDashboard").classList.remove("show")
  }

  hideError() {
    document.getElementById("errorState").classList.remove("show")
  }

  showWeatherDashboard() {
    document.getElementById("weatherDashboard").classList.add("show")
    document.getElementById("weatherDashboard").classList.add("fade-in")
  }

  // Notifications
  showNotification(message, type = "info") {
    const notification = document.getElementById("notification")
    const icon = notification.querySelector(".notification-icon")
    const messageEl = notification.querySelector(".notification-message")

    const icons = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      info: "fas fa-info-circle",
    }

    const colors = {
      success: "#10b981",
      error: "#ef4444",
      info: "#3b82f6",
    }

    icon.className = `notification-icon ${icons[type]}`
    icon.style.color = colors[type]
    messageEl.textContent = message
    notification.style.borderLeftColor = colors[type]

    notification.classList.add("show")

    setTimeout(() => {
      notification.classList.remove("show")
    }, 4000)
  }
}

// Global functions for modal and notifications
function closeApiKeyModal() {
  document.getElementById("apiKeyModal").classList.remove("show")
}

function saveApiKey() {
  if (window.weatherDashboard) {
    window.weatherDashboard.saveApiKey()
  }
}

function useDemoMode() {
  if (window.weatherDashboard) {
    window.weatherDashboard.useDemoMode()
  }
}

function hideNotification() {
  document.getElementById("notification").classList.remove("show")
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  window.weatherDashboard = new WeatherDashboard()
})

// Service Worker for offline functionality (optional)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration)
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError)
      })
  })
}

// Handle online/offline status
window.addEventListener("online", () => {
  if (window.weatherDashboard) {
    window.weatherDashboard.showNotification("Connection restored", "success")
  }
})

window.addEventListener("offline", () => {
  if (window.weatherDashboard) {
    window.weatherDashboard.showNotification("You are offline. Some features may not work.", "error")
  }
})

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + K to focus search
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault()
    document.getElementById("searchInput").focus()
  }

  // Escape to clear search
  if (e.key === "Escape") {
    document.getElementById("searchInput").value = ""
    document.getElementById("searchInput").blur()
  }
})

// Auto-refresh weather data every 10 minutes
setInterval(() => {
  if (window.weatherDashboard && window.weatherDashboard.currentLocation && !document.hidden) {
    window.weatherDashboard.retryLastSearch()
  }
}, 600000) // 10 minutes

// Handle page visibility change
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && window.weatherDashboard && window.weatherDashboard.currentLocation) {
    // Refresh data when user returns to tab
    setTimeout(() => {
      window.weatherDashboard.retryLastSearch()
    }, 1000)
  }
})
