# Implementation Plan: CAR COLLECTORS E-Commerce Platform

## Overview

This document provides a comprehensive implementation roadmap for the CAR COLLECTORS e-commerce platform - a premium full-stack solution for die-cast model car enthusiasts. The platform features a React + TypeScript frontend, Python FastAPI backend, PostgreSQL database, and AWS infrastructure (S3, CloudFront, RDS, ALB).

**Key Features:**
- Dual-role authentication (ADMIN and CUSTOMER) with JWT tokens
- Product catalog with advanced search/filter/sort capabilities
- Dual-image product display (front and back package images)
- Shopping cart with real-time stock validation
- Complete checkout and order tracking workflow
- Admin dashboard for product and order management
- Premium automotive racing aesthetic (Deep Navy, Electric Blue, KTM Orange)
- Responsive design for mobile, tablet, and desktop

**Technical Stack:**
- Frontend: React 18+, TypeScript, Zustand, Tailwind CSS, React Router v6
- Backend: Python 3.11+, FastAPI 0.100+, SQLAlchemy, Pydantic
- Database: PostgreSQL 15+ on AWS RDS
- Storage: AWS S3 with CloudFront CDN
- Authentication: JWT (HS256) with bcrypt password hashing

## Tasks

### Phase 1: Project Setup and Infrastructure

- [x] 1. Initialize project structure and development environment
  - Create monorepo structure with separate frontend/ and backend/ directories
  - Set up Python virtual environment for backend (Python 3.11+)
  - Initialize Node.js project for frontend with TypeScript
  - Configure .gitignore for Python, Node.js, and AWS credentials
  - Create README.md with project overview and setup instructions
  - Set up environment variable templates (.env.example) for both frontend and backend
  - _Requirements: Foundation for Requirements 1-30_

- [x] 2. Configure AWS infrastructure
  - Create AWS S3 bucket for product images (private access)
  - Set up S3 bucket structure: products/{uuid}/ and placeholders/
  - Configure CloudFront distribution with S3 as origin
  - Set CloudFront cache behavior (TTL: 1 year, compression enabled)
  - Upload placeholder images to placeholders/ folder
  - Create AWS Secrets Manager secret for JWT secret key
  - Configure IAM roles and policies for S3 access
  - Set up AWS RDS PostgreSQL 15+ instance (Multi-AZ for production)
  - Configure RDS security groups and parameter groups
  - _Requirements: 10.1-10.7, 18.1-18.8_

- [x] 3. Set up backend project dependencies and configuration
  - Install FastAPI, Uvicorn, SQLAlchemy, Pydantic, Alembic
  - Install authentication dependencies: python-jose, passlib[bcrypt]
  - Install AWS SDK: boto3
  - Install testing dependencies: pytest, pytest-asyncio, hypothesis
  - Create backend project structure (routers/, services/, repositories/, models/, schemas/)
  - Configure FastAPI application with CORS middleware
  - Set up logging configuration (CloudWatch integration)
  - Create config.py for environment variable management
  - _Requirements: 1.1-1.7, 15.1-15.6_

- [x] 4. Set up frontend project dependencies and configuration
  - Initialize Vite project with React 18+ and TypeScript template
  - Install core dependencies: react-router-dom, zustand, axios
  - Install UI dependencies: tailwindcss, react-hook-form, zod
  - Install testing dependencies: jest, @testing-library/react, cypress, fast-check
  - Configure Tailwind CSS with custom CAR COLLECTORS theme (Deep Navy, Electric Blue, KTM Orange)
  - Configure TypeScript (strict mode enabled)
  - Set up Axios interceptors for JWT token handling
  - Create frontend project structure (pages/, components/, store/, api/, types/, utils/)
  - _Requirements: 20.1-20.7, 21.1-21.7_

### Phase 2: Database Schema and Models

- [x] 5. Design and implement database schema
  - [x] 5.1 Create Alembic migration for users table
    - Create users table with id (UUID PK), email (UNIQUE), password_hash, full_name, mobile, role (CHECK constraint: 'ADMIN' or 'CUSTOMER'), is_active (BOOLEAN), created_at, updated_at
    - Add indexes: idx_users_email, idx_users_role
    - Add CHECK constraint for role validation
    - _Requirements: 1.1-1.7, 19.1, 19.9_
  
  - [x] 5.2 Create Alembic migration for categories table
    - Create categories table with id (UUID PK), name (UNIQUE), slug (UNIQUE), description, created_at
    - Add index: idx_categories_slug
    - _Requirements: 14.1-14.4, 19.4_
  
  - [x] 5.3 Create Alembic migration for products table
    - Create products table with id (UUID PK), name, brand, series, model, category_id (FK to categories), description, price (CHECK >= 0), stock_quantity (CHECK >= 0), scale, material, front_package_image_url (NOT NULL), back_package_image_url (NOT NULL), is_active (DEFAULT TRUE), created_at, updated_at
    - Add indexes: idx_products_brand, idx_products_series, idx_products_category, idx_products_price, idx_products_is_active, idx_products_created_at
    - Add CHECK constraints for price and stock_quantity non-negativity
    - Add FOREIGN KEY constraint to categories(id)
    - _Requirements: 10.1-10.13, 19.5, 19.6, 19.11, 19.14, 19.15_
  
  - [x] 5.4 Create Alembic migration for cart_items table
    - Create cart_items table with id (UUID PK), user_id (FK to users with CASCADE DELETE), product_id (FK to products with CASCADE DELETE), quantity (CHECK > 0), created_at, updated_at
    - Add UNIQUE constraint on (user_id, product_id)
    - Add index: idx_cart_items_user
    - _Requirements: 6.1-6.9, 19.3, 19.8, 19.12_
  
  - [x] 5.5 Create Alembic migration for orders table
    - Create orders table with id (UUID PK), order_number (UNIQUE), user_id (FK to users), status (CHECK constraint: 'PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'), total_amount (CHECK >= 0), created_at, updated_at
    - Add indexes: idx_orders_user, idx_orders_status, idx_orders_created_at, idx_orders_order_number
    - _Requirements: 8.1-8.13, 19.2, 19.7, 19.10, 25.1-25.6_
  
  - [x] 5.6 Create Alembic migration for order_items table
    - Create order_items table with id (UUID PK), order_id (FK to orders with CASCADE DELETE), product_id (FK to products), quantity (CHECK > 0), unit_price (CHECK >= 0), subtotal (CHECK >= 0)
    - Add index: idx_order_items_order
    - _Requirements: 8.7, 19.8_
  
  - [x] 5.7 Create Alembic migration for delivery_addresses table
    - Create delivery_addresses table with id (UUID PK), order_id (FK to orders with CASCADE DELETE), full_name, mobile, address_line, city, state, pincode, created_at
    - Add index: idx_delivery_addresses_order
    - _Requirements: 8.1, 29.1-29.7_

- [~] 6. Create SQLAlchemy ORM models
  - Define User model with relationships to CartItem and Order
  - Define Category model with relationship to Product
  - Define Product model with relationships to Category, CartItem, and OrderItem
  - Define CartItem model with relationships to User and Product
  - Define Order model with relationships to User, OrderItem, and DeliveryAddress
  - Define OrderItem model with relationships to Order and Product
  - Define DeliveryAddress model with relationship to Order
  - Configure cascading deletes and lazy loading strategies
  - _Requirements: 19.1-19.15_

- [~] 7. Create Pydantic schemas for request/response validation
  - Create UserCreate, UserResponse, LoginRequest, LoginResponse schemas
  - Create ProductCreate, ProductUpdate, ProductResponse, ProductListResponse schemas
  - Create CartItemCreate, CartItemUpdate, CartResponse schemas
  - Create OrderCreate, OrderResponse, OrderListResponse schemas
  - Create DeliveryAddressCreate schema
  - Create CategoryResponse schema
  - Create PaginationParams and PaginationMeta schemas
  - Add validators for email format, password length (>= 8), price/stock non-negativity
  - _Requirements: 17.1-17.8_

### Phase 3: Backend Core Services

- [ ] 8. Implement authentication and authorization services
  - [-] 8.1 Create password hashing service
    - Implement hash_password() using passlib with bcrypt (cost factor 12)
    - Implement verify_password() with constant-time comparison
    - Validate password minimum length (8 characters)
    - Write unit tests for password hashing determinism and bcrypt format
    - _Requirements: 1.3, 2.1, 2.6, 15.1-15.6_
  
  - [ ]* 8.2 Write property test for password hashing
    - **Property 3: Password Hashing Format**
    - **Validates: Requirements 1.3, 15.2, 15.6**
    - For any password, bcrypt hash should be exactly 60 characters and start with "$2b$12$"
    - Hashing the same password twice should produce different results (unique salts)
  
  - [-] 8.3 Create JWT token service
    - Implement generate_token(user_id, email, role) with HS256 algorithm
    - Set token expiration to 7 days from issuance
    - Retrieve JWT secret from AWS Secrets Manager
    - Implement verify_token() to validate signature and expiration
    - Extract user_id and role from validated tokens
    - Write unit tests for token generation and validation
    - _Requirements: 2.2, 2.4, 2.5, 16.1-16.7_
  
  - [ ]* 8.4 Write property test for JWT token validation
    - **Property 6: JWT Token Validation**
    - **Validates: Requirements 2.4, 16.4, 16.6**
    - For any valid JWT token, protected endpoints should accept it
    - For expired or invalid tokens, endpoints should reject with appropriate error
  
  - [-] 8.5 Create authentication dependencies
    - Implement get_current_user() dependency to extract user from JWT token
    - Implement require_admin() dependency to verify role='ADMIN'
    - Implement require_customer() dependency to verify role='CUSTOMER'
    - Handle 401 Unauthorized for invalid/expired tokens
    - Handle 403 Forbidden for insufficient permissions
    - _Requirements: 3.2, 3.3, 3.4_

- [ ] 9. Implement S3 image storage service
  - Create S3Service class with boto3 client initialization
  - Implement upload_product_image(product_id, image_file, image_type) method
  - Validate image format (JPEG, PNG, WebP) and size (<= 5MB)
  - Generate S3 key: products/{product_id}/{image_type}_package.{ext}
  - Upload to S3 with ContentType and CacheControl metadata
  - Return CloudFront URL (not direct S3 URL)
  - Implement delete_product_images(product_id) for cleanup
  - Write unit tests for image validation and URL construction
  - _Requirements: 10.2-10.7, 18.1-18.8, 29.1-29.6_

- [ ]* 9.1 Write property test for image upload validation
  - **Property 29: Product Image Upload Validation**
  - **Validates: Requirements 10.1, 10.2, 10.3**
  - For any product creation attempt, both front and back images must be provided
  - Each image must be JPEG/PNG/WebP format with size <= 5MB

- [ ] 10. Create product repository layer
  - Implement get_products() with filtering (search, brand, series, category, price_range, in_stock)
  - Build dynamic SQLAlchemy queries with ILIKE for search
  - Implement sorting options (price_asc, price_desc, name_asc, name_desc, newest, oldest)
  - Implement pagination with OFFSET and LIMIT
  - Implement get_product_by_id() with category relationship
  - Implement create_product() with validation
  - Implement update_product() with partial updates
  - Implement soft_delete_product() (set is_active=FALSE)
  - _Requirements: 4.1-4.10, 10.1-10.13, 11.1-11.8_

- [ ]* 10.1 Write property test for product search matching
  - **Property 9: Product Search Matching**
  - **Validates: Requirement 4.2**
  - For any product and search query, if query matches (case-insensitive) any of product name, brand, series, or model, that product should appear in search results

- [ ]* 10.2 Write property test for pagination correctness
  - **Property 14: Pagination Correctness**
  - **Validates: Requirements 4.8, 4.10, 24.3**
  - For any page and limit values (page >= 1, limit <= 100), returned results should be correct slice of total results
  - Pagination metadata should accurately reflect total count and total_pages (CEILING(total / limit))

- [ ] 11. Create cart service layer
  - Implement get_user_cart(user_id) with product details and subtotal calculation
  - Implement add_to_cart(user_id, product_id, quantity) with stock validation
  - Check for existing cart item and increment quantity if present
  - Validate product is_active=TRUE and stock_quantity >= requested quantity
  - Implement update_cart_item_quantity(cart_item_id, quantity) with stock validation
  - Implement remove_cart_item(cart_item_id)
  - Implement clear_cart(user_id)
  - Calculate cart total as sum of all item subtotals
  - _Requirements: 6.1-6.9, 7.1-7.5_

- [ ]* 11.1 Write property test for cart stock validation
  - **Property 16: Cart Stock Validation on Addition**
  - **Validates: Requirements 6.1, 6.9**
  - For any product and quantity, adding to cart should be rejected if quantity > Stock_Quantity or product is inactive

- [ ]* 11.2 Write property test for cart total calculation
  - **Property 20: Cart Total Calculation**
  - **Validates: Requirement 6.8**
  - For any cart, total should equal sum of (Cart_Item.product.price × Cart_Item.quantity) for all items
  - Each item subtotal should equal price × quantity

- [ ] 12. Implement order service layer
  - [-] 12.1 Create order number generation function
    - Generate format: "CC{YYYYMMDD}{sequence}"
    - Query for latest order_number with same date prefix
    - Increment sequence or start at 001
    - Ensure uniqueness with database constraint
    - _Requirements: 8.4, 25.1-25.6_
  
  - [ ]* 12.2 Write property test for order number format
    - **Property 23: Order Number Format and Uniqueness**
    - **Validates: Requirements 8.4, 25.1, 25.2, 19.2**
    - For any created order, order_number should match format "CC{YYYYMMDD}{sequence}"
    - Sequence is 3-digit zero-padded number
    - All order numbers should be unique
  
  - [~] 12.3 Implement create_order(user_id, delivery_address) with atomic transaction
    - Begin database transaction
    - Fetch user's cart items with product details
    - Validate cart is not empty
    - Validate all products have sufficient stock and are active
    - Generate order_number
    - Calculate total_amount
    - Create Order record with status='PENDING'
    - Create DeliveryAddress record
    - Create OrderItem records with unit_price and subtotal snapshots
    - Decrement product stock_quantity atomically
    - Delete cart items
    - Commit transaction or rollback on any error
    - _Requirements: 8.1-8.13_
  
  - [ ]* 12.4 Write property test for order creation stock decrement
    - **Property 25: Order Creation Stock Decrement**
    - **Validates: Requirements 8.9, 26.1, 26.2**
    - For any successful order creation, each product's Stock_Quantity should be decremented by ordered quantity
    - Stock_Quantity should never become negative
  
  - [ ]* 12.5 Write property test for order total calculation
    - **Property 24: Order Total Calculation**
    - **Validates: Requirements 8.5**
    - For any cart, when creating order, order.total_amount should equal sum of (Cart_Item.product.price × Cart_Item.quantity) for all items
  
  - [~] 12.6 Implement get_user_orders(user_id, filters, pagination)
    - Filter by user_id for customer access
    - Support filtering by status
    - Support pagination
    - Include order items, delivery address, and product details
    - _Requirements: 9.1-9.6_
  
  - [~] 12.7 Implement get_order_by_id(order_id, user_id) with authorization
    - Verify user_id matches order owner (for customers)
    - Return complete order details
    - _Requirements: 9.4, 9.6_

- [ ] 13. Implement order status management service
  - Implement update_order_status(order_id, new_status, admin_user)
  - Validate status transitions using state machine logic
  - Allowed transitions: PENDING→{CONFIRMED, CANCELLED}, CONFIRMED→{PACKED, CANCELLED}, PACKED→{OUT_FOR_DELIVERY, CANCELLED}, OUT_FOR_DELIVERY→{DELIVERED, CANCELLED}
  - When transitioning to CANCELLED, restore stock_quantity for all order items
  - Update order updated_at timestamp
  - _Requirements: 12.6-12.12, 26.3_

- [ ]* 13.1 Write property test for order status transitions
  - **Property 32: Order Status Transition Validation**
  - **Validates: Requirements 12.6, 12.7, 12.8, 12.9, 12.10**
  - For any order status update, transition must be valid according to state machine
  - Invalid transitions should be rejected

- [ ]* 13.2 Write property test for stock restoration on cancellation
  - **Property 33: Stock Restoration on Cancellation**
  - **Validates: Requirements 12.11, 26.3**
  - For any order transitioning to CANCELLED status, Stock_Quantity for each product should be restored by adding back ordered quantities

### Phase 4: Backend API Endpoints

- [ ] 14. Implement authentication API endpoints
  - [~] 14.1 POST /auth/register - Customer registration
    - Validate email format and password length (>= 8)
    - Check for duplicate email (return 409 Conflict if exists)
    - Hash password with bcrypt
    - Create user with role='CUSTOMER'
    - Generate JWT token with 7-day expiration
    - Return user profile and token
    - _Requirements: 1.1-1.7_
  
  - [ ]* 14.2 Write property test for customer registration
    - **Property 1: Customer Registration Creates User with Correct Role**
    - **Validates: Requirements 1.1, 1.4, 1.5**
    - For any valid email and password (>= 8 characters), registering as customer should create user with role='CUSTOMER' and return valid JWT token
  
  - [ ]* 14.3 Write property test for duplicate email rejection
    - **Property 2: Duplicate Email Registration Rejection**
    - **Validates: Requirement 1.2**
    - For any user already registered with an email, attempting to register another user with same email should be rejected with conflict error
  
  - [~] 14.4 POST /auth/login - User login
    - Validate email and password provided
    - Query user by email
    - Verify password using bcrypt
    - Generate JWT token on success
    - Return 401 Unauthorized on invalid credentials
    - _Requirements: 2.1-2.6_
  
  - [~] 14.5 POST /auth/logout - Client-side token removal
    - Optional endpoint (stateless JWT, client handles logout)
    - _Requirements: 27.4_
  
  - [~] 14.6 GET /auth/me - Get current user profile
    - Require JWT authentication
    - Return current user details from token
    - _Requirements: 2.4_

- [ ] 15. Implement public product API endpoints
  - [~] 15.1 GET /products - List products with filters
    - Accept query params: page, limit, search, brand, series, category, min_price, max_price, in_stock, sort_by
    - Validate pagination params (page >= 1, limit <= 100)
    - Filter by is_active=TRUE for public access
    - Apply search matching (name, brand, series, model - case-insensitive)
    - Apply brand, series, category filters
    - Apply price range filters (inclusive bounds)
    - Apply in_stock filter (stock_quantity > 0)
    - Apply sorting
    - Return paginated results with metadata (page, limit, total, total_pages)
    - _Requirements: 4.1-4.10, 24.1-24.5_
  
  - [ ]* 15.2 Write property test for price range filtering
    - **Property 11: Price Range Filtering**
    - **Validates: Requirement 4.5**
    - For any min_price and max_price values, returned products should have price >= min_price AND price <= max_price
  
  - [ ]* 15.3 Write property test for stock availability filtering
    - **Property 12: Stock Availability Filtering**
    - **Validates: Requirements 4.6, 28.1**
    - For any product set, filtering by in_stock=TRUE should return only products with Stock_Quantity > 0
  
  - [~] 15.4 GET /products/:id - Get product details
    - Return complete product information including both image URLs
    - Include category details
    - Show stock availability status
    - _Requirements: 5.1-5.5_
  
  - [~] 15.5 GET /categories - List all categories
    - Return categories with product_count
    - _Requirements: 14.1-14.2_

- [ ] 16. Implement customer cart API endpoints
  - [~] 16.1 GET /cart - Get current user's cart
    - Require CUSTOMER authentication
    - Return cart items with product details, quantities, and subtotals
    - Calculate and return cart total
    - _Requirements: 6.8, 7.1_
  
  - [~] 16.2 POST /cart/items - Add item to cart
    - Require CUSTOMER authentication
    - Validate product exists and is active
    - Validate stock_quantity >= requested quantity
    - Check for existing cart item and increment if present
    - Create new cart item or update existing
    - Return updated cart
    - _Requirements: 6.1-6.3_
  
  - [~] 16.3 PATCH /cart/items/:id - Update cart item quantity
    - Require CUSTOMER authentication
    - Validate new quantity against stock_quantity
    - Update cart item quantity
    - Return updated cart
    - _Requirements: 6.3-6.4_
  
  - [~] 16.4 DELETE /cart/items/:id - Remove cart item
    - Require CUSTOMER authentication
    - Delete cart item
    - Return updated cart
    - _Requirements: 6.5_
  
  - [~] 16.5 DELETE /cart - Clear entire cart
    - Require CUSTOMER authentication
    - Delete all cart items for user
    - Return empty cart
    - _Requirements: 6.6_

- [ ] 17. Implement customer order API endpoints
  - [~] 17.1 POST /orders - Create order from cart
    - Require CUSTOMER authentication
    - Validate delivery address (all required fields present)
    - Validate cart is not empty
    - Call order service create_order() with atomic transaction
    - Handle stock validation errors with specific out-of-stock items
    - Return created order details with status='PENDING'
    - _Requirements: 8.1-8.13, 29.1-29.7_
  
  - [ ]* 17.2 Write property test for delivery address validation
    - **Property 22: Delivery Address Validation**
    - **Validates: Requirements 8.1, 29.1-29.6**
    - For any checkout submission, if Delivery_Address is missing required field, checkout should be rejected
  
  - [~] 17.2 GET /orders - Get customer's order history
    - Require CUSTOMER authentication
    - Filter by user_id automatically
    - Support pagination and status filtering
    - Return order list with summary details
    - _Requirements: 9.1-9.3_
  
  - [~] 17.3 GET /orders/:id - Get order details
    - Require CUSTOMER authentication
    - Verify order belongs to authenticated user
    - Return complete order with items, delivery address, and status
    - Return 403 Forbidden if attempting to access another user's order
    - _Requirements: 9.4-9.6_

- [ ] 18. Implement admin product management API endpoints
  - [~] 18.1 POST /admin/products - Create product
    - Require ADMIN authentication
    - Accept multipart form-data with product fields and two image files
    - Validate both front_package_image and back_package_image provided
    - Validate image formats (JPEG, PNG, WebP) and sizes (<= 5MB)
    - Generate product UUID
    - Upload images to S3 via S3Service
    - Create product record with CloudFront URLs
    - Validate price >= 0, stock_quantity >= 0, category exists
    - Return created product with status 201
    - Handle S3 upload failures with cleanup
    - _Requirements: 10.1-10.13_
  
  - [~] 18.2 PATCH /admin/products/:id - Update product
    - Require ADMIN authentication
    - Accept multipart form-data with optional product fields and optional image files
    - If new images provided, upload to S3 and update URLs
    - Support updating single image (front or back)
    - Validate updated fields (price >= 0, stock_quantity >= 0)
    - Update product record and updated_at timestamp
    - Return updated product
    - _Requirements: 11.1-11.4_
  
  - [~] 18.3 DELETE /admin/products/:id - Soft delete product
    - Require ADMIN authentication
    - Set is_active=FALSE (soft delete)
    - Update updated_at timestamp
    - Return success response
    - _Requirements: 11.5-11.7_
  
  - [~] 18.4 GET /admin/products - Admin product listing
    - Require ADMIN authentication
    - Include both active and inactive products
    - Support same filters as public listing
    - Include is_active field in response
    - _Requirements: 11.7_

- [ ] 19. Implement admin order management API endpoints
  - [~] 19.1 GET /admin/orders - List all orders
    - Require ADMIN authentication
    - Support filtering by status, date_from, date_to
    - Support search by order_number or customer name
    - Support pagination
    - Include customer information in response
    - _Requirements: 12.1-12.4_
  
  - [~] 19.2 GET /admin/orders/:id - Get order details
    - Require ADMIN authentication
    - Return complete order with customer info, items, and delivery address
    - _Requirements: 12.5_
  
  - [~] 19.3 PATCH /admin/orders/:id/status - Update order status
    - Require ADMIN authentication
    - Validate status transition is allowed
    - Call order service update_order_status()
    - Handle stock restoration on CANCELLED transition
    - Return updated order
    - Return 400 Bad Request for invalid transitions with allowed states
    - _Requirements: 12.6-12.12_

- [~] 20. Implement admin dashboard API endpoint
  - GET /admin/dashboard/stats - Get dashboard statistics
  - Require ADMIN authentication
  - Calculate total_products count
  - Calculate total_stock sum
  - Count orders grouped by status
  - Calculate total revenue (sum of total_amount where status != CANCELLED)
  - Calculate revenue for current month
  - Calculate revenue for current week
  - Fetch recent orders (latest 10)
  - _Requirements: 13.1-13.7_

- [~] 21. Implement global error handling middleware
  - Catch validation errors (Pydantic) → 400 Bad Request
  - Catch authentication errors → 401 Unauthorized
  - Catch authorization errors → 403 Forbidden
  - Catch not found errors → 404 Not Found
  - Catch duplicate key errors → 409 Conflict
  - Catch all other exceptions → 500 Internal Server Error
  - Use consistent error format: { error: { code, message, details } }
  - Log errors to CloudWatch (sanitize sensitive data)
  - _Requirements: 22.1-22.8_

- [~] 22. Checkpoint - Backend API testing and validation
  - Run all backend unit tests (pytest)
  - Run all property-based tests (Hypothesis)
  - Test all API endpoints with Postman or Thunder Client
  - Verify JWT authentication and authorization
  - Verify stock validation during cart and order operations
  - Verify S3 image uploads and CloudFront URLs
  - Verify database constraints and transaction atomicity
  - Verify error handling and response formats
  - Ensure all tests pass, ask the user if questions arise

### Phase 5: Frontend Core Setup

- [~] 23. Configure frontend routing structure
  - Set up React Router v6 with BrowserRouter
  - Create route definitions for public, customer, and admin routes
  - Implement ProtectedRoute component for customer routes
  - Implement AdminRoute component for admin routes
  - Handle 404 Not Found page
  - Configure route-based code splitting for performance
  - _Requirements: 3.2, 3.3_

- [ ] 24. Implement Zustand state management stores
  - [~] 24.1 Create authStore
    - State: user (User | null), token (string | null), isAuthenticated (boolean)
    - Actions: login(email, password), logout(), register(data)
    - Persist token in localStorage
    - Handle token expiration and auto-logout
    - _Requirements: 1.1-1.7, 2.1-2.6, 27.1-27.5_
  
  - [~] 24.2 Create cartStore
    - State: items (CartItem[]), total (number)
    - Actions: fetchCart(), addItem(productId, quantity), updateQuantity(itemId, quantity), removeItem(itemId), clearCart()
    - Handle stock validation errors from API
    - _Requirements: 6.1-6.9_
  
  - [~] 24.3 Create uiStore
    - State: isLoading (boolean), error (string | null), successMessage (string | null)
    - Actions: setLoading(), setError(), clearError(), setSuccess()
    - Used for global UI feedback

- [~] 25. Create API service layer with Axios
  - Configure Axios base URL and timeout
  - Create axios instance with request interceptor to add JWT token
  - Create response interceptor for 401 handling (auto-logout and redirect)
  - Create authApi.ts: register(), login(), logout(), getCurrentUser()
  - Create productsApi.ts: getProducts(filters), getProductById(id), getCategories()
  - Create cartApi.ts: getCart(), addToCart(productId, quantity), updateCartItem(itemId, quantity), removeCartItem(itemId), clearCart()
  - Create ordersApi.ts: createOrder(deliveryAddress), getOrders(filters), getOrderById(id)
  - Create adminApi.ts: createProduct(formData), updateProduct(id, formData), deleteProduct(id), getAdminProducts(filters), getAdminOrders(filters), updateOrderStatus(id, status), getDashboardStats()
  - _Requirements: 1.1-30.7_

- [~] 26. Create TypeScript type definitions
  - Define User, Product, Category, CartItem, Cart, Order, OrderItem, DeliveryAddress interfaces
  - Define PaginationParams, PaginationMeta, ProductFilterParams interfaces
  - Define API response types
  - Define enum for OrderStatus
  - Ensure type safety across all components and API calls
  - _Requirements: All requirements_

- [~] 27. Implement utility functions
  - Create formatPrice(amount) for currency formatting (₹)
  - Create formatDate(timestamp) for date display
  - Create validators for email, password, mobile number
  - Create constants for API base URL, pagination defaults, image placeholders
  - _Requirements: 17.2, 21.1-21.7_

### Phase 6: Frontend Components - Common

- [ ] 28. Create common UI components
  - [~] 28.1 Button component
    - Support variants: primary (Electric Blue), secondary (Deep Navy), accent (KTM Orange)
    - Support sizes: small, medium, large
    - Support disabled and loading states
    - Apply premium hover effects
    - _Requirements: 21.1-21.7_
  
  - [~] 28.2 Input component
    - Support text, email, password, number types
    - Display validation errors below input
    - Apply Deep Navy background with blue borders
    - Support disabled state
    - _Requirements: 21.1-21.7_
  
  - [~] 28.3 Modal component
    - Overlay with centered content
    - Close on overlay click or X button
    - Trap focus inside modal
    - Apply premium styling
    - _Requirements: 21.1-21.7_
  
  - [~] 28.4 LoadingSpinner component
    - Animated spinner with Electric Blue color
    - Support different sizes
    - _Requirements: 21.1-21.7_
  
  - [~] 28.5 ErrorBoundary component
    - Catch React errors and display fallback UI
    - Log errors for debugging
    - _Requirements: 22.1-22.8_

- [ ] 29. Create layout components
  - [~] 29.1 Header component
    - Display CAR COLLECTORS logo and tagline
    - Navigation links (Home, Products, About)
    - Cart icon with item count badge (authenticated customers)
    - Login/Register or Profile/Logout buttons based on auth state
    - Mobile hamburger menu for responsive design
    - Apply Deep Navy background with Electric Blue accents
    - _Requirements: 20.2-20.3, 21.1-21.7_
  
  - [~] 29.2 Footer component
    - Display copyright, social links, contact info
    - Apply Deep Navy background
    - _Requirements: 21.1-21.7_
  
  - [~] 29.3 Navigation component
    - Horizontal nav for desktop, hamburger for mobile
    - Highlight active route
    - _Requirements: 20.2-20.3_
  
  - [~] 29.4 AdminSidebar component
    - Vertical sidebar with links to Dashboard, Products, Orders
    - Highlight active section
    - Display admin user name
    - Logout button
    - _Requirements: 21.1-21.7_

### Phase 7: Frontend Components - Product Catalog

- [ ] 30. Create product-related components
  - [~] 30.1 ProductCard component
    - Display product image (front_package_image_url)
    - Show product name, brand, series
    - Display price in KTM Orange (₹)
    - Show stock availability ("X in stock" or "OUT OF STOCK")
    - Add to Cart button (disabled if out of stock)
    - Apply Deep Navy card background with blue border
    - Hover effect: border transitions to orange
    - Support responsive grid layout (1 column mobile, 2 tablet, 4 desktop)
    - _Requirements: 4.1-4.10, 21.1-21.7, 28.2-28.3_
  
  - [~] 30.2 ProductGrid component
    - Render array of ProductCard components
    - Apply responsive grid layout
    - Handle empty state ("No products found")
    - _Requirements: 20.1_
  
  - [~] 30.3 ProductFilters component
    - Search input for text search
    - Brand dropdown filter
    - Category dropdown filter
    - Price range inputs (min/max)
    - In stock checkbox filter
    - Sort dropdown (price_asc, price_desc, name_asc, name_desc, newest, oldest)
    - Apply/Clear buttons
    - Responsive layout (stack vertically on mobile)
    - _Requirements: 4.2-4.7_
  
  - [~] 30.4 ProductSearch component
    - Search input with icon
    - Debounce input for performance
    - Clear button when text entered
    - _Requirements: 4.2_
  
  - [~] 30.5 ImageToggle component
    - Display main image (front or back) in square aspect ratio
    - Toggle buttons: "Front Package" and "Back Package"
    - Active button highlighted with Electric Blue
    - Thumbnail previews below main image
    - Click thumbnail to switch main image
    - Apply Deep Navy background for image container
    - _Requirements: 5.2, 30.1-30.7_

- [ ] 31. Create product pages
  - [~] 31.1 ProductListingPage
    - Render ProductFilters, ProductSearch, ProductGrid components
    - Fetch products from API with filters and pagination
    - Display pagination controls (Previous, Page X of Y, Next)
    - Handle loading state with LoadingSpinner
    - Handle error state with error message
    - Update URL query params when filters change
    - _Requirements: 4.1-4.10, 23.1-23.7_
  
  - [~] 31.2 ProductDetailsPage
    - Fetch product details by ID from route params
    - Render ImageToggle component for dual images
    - Display full product information (name, brand, series, model, description, price, scale, material)
    - Show category badge
    - Display stock availability prominently
    - Quantity selector (default: 1, min: 1, max: stock_quantity)
    - Add to Cart button (handle success/error)
    - Breadcrumb navigation (Home > Products > Current Product)
    - Handle loading and error states
    - _Requirements: 5.1-5.5, 6.1-6.3_

### Phase 8: Frontend Components - Cart and Checkout

- [ ] 32. Create cart-related components
  - [~] 32.1 CartItem component
    - Display product image, name, brand
    - Show unit price and subtotal
    - Quantity selector with +/- buttons
    - Remove button with confirmation
    - Handle quantity update API calls
    - Show stock validation errors
    - _Requirements: 6.3-6.5_
  
  - [~] 32.2 CartSummary component
    - Display cart total prominently (KTM Orange)
    - List all items with quantities
    - Proceed to Checkout button
    - Continue Shopping link
    - _Requirements: 6.8_
  
  - [~] 32.3 CartIcon component
    - Shopping cart icon in header
    - Badge showing item count
    - Click to navigate to cart page
    - _Requirements: 20.6_

- [ ] 33. Create cart and checkout pages
  - [~] 33.1 CartPage
    - Fetch cart from API on mount
    - Render list of CartItem components
    - Display CartSummary component
    - Handle empty cart state ("Your cart is empty")
    - Clear cart button with confirmation modal
    - Handle loading and error states
    - _Requirements: 6.1-6.9, 7.1-7.5_
  
  - [~] 33.2 CheckoutPage
    - Fetch cart to validate before checkout
    - Display cart summary (read-only)
    - DeliveryAddressForm with all required fields
    - Form validation using React Hook Form + Zod
    - Submit button to create order
    - Handle stock validation errors from API (display specific items)
    - On success, clear cart and redirect to order confirmation
    - Handle loading state during order creation
    - _Requirements: 8.1-8.13, 29.1-29.7_
  
  - [~] 33.3 DeliveryAddressForm component
    - Inputs: full_name, mobile, address_line, city, state, pincode
    - Validate all fields required
    - Validate mobile number format
    - Validate pincode format
    - Apply premium form styling
    - _Requirements: 29.1-29.7_

### Phase 9: Frontend Components - Orders

- [ ] 34. Create order-related components
  - [~] 34.1 OrderCard component
    - Display order_number, date, total_amount
    - Show OrderStatusBadge
    - Display item count
    - View Details button
    - Apply card styling with hover effect
    - _Requirements: 9.1-9.6_
  
  - [~] 34.2 OrderStatusBadge component
    - Display status with color coding
    - PENDING: yellow, CONFIRMED: blue, PACKED: purple, OUT_FOR_DELIVERY: orange, DELIVERED: green, CANCELLED: red
    - Apply badge styling with rounded corners
    - _Requirements: 9.1-9.6_

- [ ] 35. Create order pages
  - [~] 35.1 OrderHistoryPage
    - Require CUSTOMER authentication
    - Fetch user's orders from API
    - Display list of OrderCard components
    - Support filtering by status
    - Support pagination
    - Handle empty state ("No orders yet")
    - Handle loading and error states
    - _Requirements: 9.1-9.3_
  
  - [~] 35.2 OrderDetailsPage
    - Require CUSTOMER authentication
    - Fetch order details by ID from route params
    - Display order_number, date, OrderStatusBadge
    - List all OrderItems with product name, brand, quantity, unit_price, subtotal
    - Display delivery address details
    - Show total_amount prominently
    - Breadcrumb navigation (Orders > Order Details)
    - Handle loading and error states
    - Handle 403 Forbidden (redirect to orders list)
    - _Requirements: 9.4-9.6_

### Phase 10: Frontend Components - Authentication

- [ ] 36. Create authentication pages
  - [~] 36.1 LoginPage
    - Email and password inputs
    - Form validation (email format, password required)
    - Submit to authStore.login()
    - Handle login errors (display message)
    - Redirect to home on success (or intended page)
    - Link to registration page
    - Apply premium form styling
    - _Requirements: 2.1-2.6_
  
  - [~] 36.2 RegisterPage
    - Inputs: email, password, confirm password, full_name, mobile (optional)
    - Form validation (email format, password >= 8 chars, passwords match)
    - Submit to authStore.register()
    - Handle registration errors (display message, highlight duplicate email)
    - Redirect to home on success
    - Link to login page
    - Apply premium form styling
    - _Requirements: 1.1-1.7_
  
  - [~] 36.3 ProfilePage
    - Require CUSTOMER authentication
    - Display current user profile (email, full_name, mobile)
    - Edit profile button (future feature - MVP just displays)
    - Logout button
    - _Requirements: 2.4_

### Phase 11: Frontend Components - Admin Dashboard

- [ ] 37. Create admin dashboard components and pages
  - [~] 37.1 DashboardPage
    - Require ADMIN authentication
    - Fetch dashboard stats from API
    - Display statistics cards: Total Products, Total Stock, Orders by Status, Revenue (Total, This Month, This Week)
    - Display recent orders table with order_number, customer, status, total_amount, date
    - Apply premium dashboard styling with cards and charts
    - Handle loading and error states
    - _Requirements: 13.1-13.7_
  
  - [~] 37.2 ProductListPage (Admin)
    - Require ADMIN authentication
    - Fetch admin products (include inactive)
    - Display products table with image, name, brand, price, stock, is_active, actions
    - Actions: Edit, Delete (soft delete)
    - Add New Product button
    - Search and filter controls
    - Pagination controls
    - Handle loading and error states
    - _Requirements: 11.7_
  
  - [~] 37.3 ProductFormPage (Admin)
    - Require ADMIN authentication
    - Support both create and edit modes (based on route params)
    - Form fields: name, brand, series, model, category_id, description, price, stock_quantity, scale, material
    - Image upload inputs: front_package_image, back_package_image (both required for create, optional for edit)
    - Image preview before upload
    - Form validation (all required fields, price >= 0, stock_quantity >= 0)
    - Submit to create or update API endpoint
    - Handle image upload errors (format, size)
    - On success, redirect to product list
    - Handle loading state during submission
    - _Requirements: 10.1-10.13, 11.1-11.4_
  
  - [~] 37.4 OrderManagementPage (Admin)
    - Require ADMIN authentication
    - Fetch all orders from API
    - Display orders table with order_number, customer, status, total_amount, date, actions
    - Actions: View Details, Update Status dropdown
    - Filter controls: status, date range, search (order_number, customer name)
    - Pagination controls
    - Handle status update API calls
    - Validate status transitions (disable invalid options)
    - Handle loading and error states
    - _Requirements: 12.1-12.12_

### Phase 12: Frontend Pages - Public

- [ ] 38. Create public pages
  - [~] 38.1 HomePage
    - Hero section with CAR COLLECTORS branding and tagline
    - Featured products section (latest or popular)
    - Categories section with links
    - Call-to-action: Shop Now button
    - Apply premium design with hero image/gradient background
    - _Requirements: 21.1-21.7_
  
  - [~] 38.2 AboutPage
    - About CAR COLLECTORS platform
    - Mission statement for die-cast collectors
    - Contact information
    - Apply premium styling
    - _Requirements: 21.1-21.7_
  
  - [~] 38.3 NotFoundPage
    - 404 error message
    - Link back to home
    - Apply premium styling
    - _Requirements: Error handling_

### Phase 13: Frontend Styling and Responsiveness

- [~] 39. Implement Tailwind CSS custom theme
  - Configure tailwind.config.js with CAR COLLECTORS colors
  - Deep Navy: #0f172a (navy-900), #1e293b (navy-800), #334155 (navy-700)
  - Electric Blue: #2563eb (blue-600), #3b82f6 (blue-500), #60a5fa (blue-400)
  - KTM Orange: #ea580c (orange-500), #c2410c (orange-600)
  - Configure fonts: Inter (body), Rajdhani (display headers)
  - Set up responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
  - _Requirements: 21.1-21.7_

- [~] 40. Implement responsive design for all components
  - Product grid: 1 column (mobile), 2 columns (tablet), 4 columns (desktop)
  - Navigation: hamburger menu (mobile), horizontal nav (desktop)
  - Forms: stack inputs vertically (mobile), 2-column layout (desktop)
  - Dashboard: stack cards vertically (mobile), grid layout (desktop)
  - Apply touch-friendly button sizes (min 44x44px) for mobile
  - Test all pages on mobile, tablet, and desktop viewports
  - _Requirements: 20.1-20.7_

- [~] 41. Implement lazy loading for images and routes
  - Use React.lazy() for route-based code splitting
  - Use react-lazy-load-image-component for product images
  - Set up Suspense fallback with LoadingSpinner
  - _Requirements: 20.5, 23.1-23.7_

### Phase 14: Testing

- [~] 42. Write frontend unit tests
  - Test authStore actions (login, logout, register)
  - Test cartStore actions (addItem, updateQuantity, removeItem)
  - Test Button, Input, Modal components rendering
  - Test ProductCard component rendering and interactions
  - Test form validation logic
  - Use Jest and React Testing Library
  - Achieve 70%+ code coverage
  - _Requirements: All frontend requirements_

- [ ] 43. Write frontend integration tests with Cypress
  - [~] 43.1 Customer journey test
    - Register new account
    - Login
    - Browse products and apply filters
    - View product details
    - Add multiple products to cart
    - Update cart quantities
    - Complete checkout with delivery address
    - View order in order history
    - _Requirements: 1.1-9.6_
  
  - [~] 43.2 Admin journey test
    - Login as admin
    - View dashboard
    - Create new product with image uploads
    - Edit product details
    - Update product stock
    - View all orders
    - Update order status through workflow
    - _Requirements: 3.1-13.7_
  
  - [~] 43.3 Error scenarios test
    - Out-of-stock handling during checkout
    - Validation errors (login, registration, forms)
    - Unauthorized access attempts
    - _Requirements: 22.1-22.8_

- [~] 44. Checkpoint - Full system testing
  - Run all backend unit tests and property tests
  - Run all frontend unit tests
  - Run all Cypress E2E tests
  - Manual testing of complete user flows
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - Test on multiple devices (mobile, tablet, desktop)
  - Verify performance targets (200ms listings, 100ms cart, 300ms checkout)
  - Ensure all tests pass, ask the user if questions arise

### Phase 15: Deployment and DevOps

- [~] 45. Set up database deployment
  - Run Alembic migrations on production RDS instance
  - Seed initial categories data
  - Create initial admin user account
  - Verify database constraints and indexes
  - Configure automated backups (RDS daily snapshots)
  - _Requirements: 19.1-19.15_

- [~] 46. Deploy backend to AWS
  - Dockerize FastAPI application
  - Push Docker image to AWS ECR
  - Set up ECS cluster with Fargate tasks
  - Configure Application Load Balancer
  - Set up auto-scaling policies (CPU/memory based)
  - Configure health checks
  - Set up environment variables from AWS Secrets Manager
  - Configure CloudWatch logs and alarms
  - Test backend API endpoints via ALB
  - _Requirements: All backend requirements_

- [~] 47. Deploy frontend to AWS
  - Build React application for production (npm run build)
  - Create S3 bucket for static hosting
  - Configure S3 bucket for website hosting
  - Upload build artifacts to S3
  - Set up CloudFront distribution for frontend
  - Configure CloudFront with S3 origin
  - Set up custom domain with Route 53 (if applicable)
  - Configure HTTPS with ACM certificate
  - Test frontend via CloudFront URL
  - _Requirements: All frontend requirements_

- [~] 48. Configure CI/CD pipeline
  - Set up GitHub Actions or AWS CodePipeline
  - Backend pipeline: lint, test, build Docker image, deploy to ECS
  - Frontend pipeline: lint, test, build, deploy to S3, invalidate CloudFront cache
  - Configure staging and production environments
  - Set up deployment notifications (Slack/email)
  - _Requirements: DevOps best practices_

- [~] 49. Final production verification
  - Verify all API endpoints working in production
  - Verify all frontend pages loading correctly
  - Verify image uploads to S3 and CloudFront delivery
  - Verify JWT authentication and authorization
  - Verify order creation and stock updates
  - Verify email notifications (if implemented)
  - Perform load testing (simulate concurrent users)
  - Verify monitoring dashboards (CloudWatch)
  - Verify error logging and alerting
  - Document any production-specific configuration
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based test tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints (22, 44, 49) ensure incremental validation before proceeding
- Property tests validate universal correctness properties defined in the design document
- Database constraints provide defense-in-depth for data integrity
- The implementation follows a layered architecture for maintainability
- All tasks build incrementally on previous work with clear dependencies

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "2.1", "3.1", "4.1"]
    },
    {
      "id": 1,
      "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "6.1", "7.1"]
    },
    {
      "id": 2,
      "tasks": ["8.1", "8.3", "8.5", "9.1", "10.1", "11.1", "12.1", "13.1"]
    },
    {
      "id": 3,
      "tasks": ["8.2", "8.4", "9.2", "10.2", "10.3", "11.2", "11.3", "12.2", "12.3", "13.2", "13.3"]
    },
    {
      "id": 4,
      "tasks": ["12.4", "12.5", "12.6", "12.7"]
    },
    {
      "id": 5,
      "tasks": ["14.1", "14.4", "14.5", "14.6", "15.1", "15.4", "15.5", "16.1", "16.2", "16.3", "16.4", "16.5"]
    },
    {
      "id": 6,
      "tasks": ["14.2", "14.3", "15.2", "15.3", "17.1", "17.2", "17.3", "18.1", "18.2", "18.3", "18.4", "19.1", "19.2", "19.3", "20.1", "21.1"]
    },
    {
      "id": 7,
      "tasks": ["22.1"]
    },
    {
      "id": 8,
      "tasks": ["23.1", "24.1", "24.2", "24.3", "25.1", "26.1", "27.1"]
    },
    {
      "id": 9,
      "tasks": ["28.1", "28.2", "28.3", "28.4", "28.5", "29.1", "29.2", "29.3", "29.4"]
    },
    {
      "id": 10,
      "tasks": ["30.1", "30.2", "30.3", "30.4", "30.5"]
    },
    {
      "id": 11,
      "tasks": ["31.1", "31.2"]
    },
    {
      "id": 12,
      "tasks": ["32.1", "32.2", "32.3"]
    },
    {
      "id": 13,
      "tasks": ["33.1", "33.2", "33.3"]
    },
    {
      "id": 14,
      "tasks": ["34.1", "34.2"]
    },
    {
      "id": 15,
      "tasks": ["35.1", "35.2"]
    },
    {
      "id": 16,
      "tasks": ["36.1", "36.2", "36.3"]
    },
    {
      "id": 17,
      "tasks": ["37.1", "37.2", "37.3", "37.4"]
    },
    {
      "id": 18,
      "tasks": ["38.1", "38.2", "38.3"]
    },
    {
      "id": 19,
      "tasks": ["39.1", "40.1", "41.1"]
    },
    {
      "id": 20,
      "tasks": ["42.1", "43.1", "43.2", "43.3"]
    },
    {
      "id": 21,
      "tasks": ["44.1"]
    },
    {
      "id": 22,
      "tasks": ["45.1", "46.1", "47.1", "48.1"]
    },
    {
      "id": 23,
      "tasks": ["49.1"]
    }
  ]
}
```
