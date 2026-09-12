# Requirements Document

## Introduction

CAR COLLECTORS is a premium full-stack e-commerce platform designed for die-cast model car enthusiasts, with an initial focus on Hot Wheels collectibles. The platform provides a distinctive automotive racing aesthetic (Deep Navy/Electric Blue/KTM Orange color scheme) and enables two distinct user experiences: customers can browse, search, and purchase die-cast cars with a streamlined checkout process, while administrators manage the product catalog, inventory, and order fulfillment through a comprehensive dashboard.

The system prioritizes professional-grade security (JWT authentication, bcrypt password hashing), scalability (AWS infrastructure with S3, RDS, CloudFront CDN), and a premium user experience across mobile, tablet, and desktop devices. A critical design constraint is that every product must display exactly two package images (front and back of the original Hot Wheels card/package), stored in AWS S3 with URLs persisted in PostgreSQL.

The platform supports a complete e-commerce workflow: customer registration and authentication, product catalog browsing with advanced search/filter capabilities, shopping cart management with real-time stock validation, secure checkout with delivery address capture, and order tracking through a defined status lifecycle (PENDING → CONFIRMED → PACKED → OUT_FOR_DELIVERY → DELIVERED, with optional CANCELLED state). Administrators have separate authentication flows and access to tools for product CRUD operations (including dual-image uploads to S3), inventory management, order status updates, and dashboard analytics.

## Glossary

- **System**: The CAR COLLECTORS e-commerce platform
- **Customer**: A user with role='CUSTOMER' who can browse products, manage cart, and place orders
- **Admin**: A user with role='ADMIN' who can manage products, inventory, and orders
- **Product**: A die-cast model car item with dual package images (front and back)
- **Cart**: A collection of cart items associated with a customer user
- **Order**: A confirmed purchase transaction with status, items, total amount, and delivery address
- **Product_Catalog**: The searchable and filterable collection of active products
- **Dual_Image_Constraint**: The requirement that every product has exactly two images (front_package and back_package)
- **JWT_Token**: JSON Web Token used for authentication with 7-day expiration
- **Stock_Quantity**: The available inventory count for a product (must be >= 0)
- **Order_Status**: One of PENDING, CONFIRMED, PACKED, OUT_FOR_DELIVERY, DELIVERED, or CANCELLED
- **S3_Storage**: AWS S3 bucket for storing product package images
- **Delivery_Address**: Complete shipping information including full_name, mobile, address_line, city, state, pincode
- **Password_Hash**: Bcrypt-hashed password stored in database (60 characters)
- **Active_Product**: A product where is_active=TRUE, visible to customers
- **CloudFront_CDN**: AWS content delivery network serving product images globally
- **Cart_Item**: A product reference with quantity in a customer's cart
- **Order_Item**: A product snapshot with quantity, unit_price, and subtotal in an order
- **Category**: A classification for products (e.g., Sports Cars, Exotics, Trucks)
- **Search_Query**: Customer input for finding products by name, brand, series, or model
- **Stock_Validation**: Verification that requested quantity does not exceed available stock

## Requirements

### Requirement 1: Customer Registration

**User Story:** As a new customer, I want to register for an account with my email and password, so that I can place orders and track my purchases.

#### Acceptance Criteria

1. WHEN a customer submits registration with valid email and password (>= 8 characters), THEN the System SHALL create a new user with role='CUSTOMER'
2. WHEN a customer attempts registration with an existing email, THEN the System SHALL reject the registration and return a conflict error
3. WHEN a customer completes registration, THEN the System SHALL hash the password using bcrypt with cost factor 12
4. WHEN a customer completes registration, THEN the System SHALL generate a JWT_Token with 7-day expiration
5. WHEN a customer completes registration, THEN the System SHALL return the user profile and JWT_Token for immediate authentication
6. THE System SHALL validate email format before creating user accounts
7. WHEN a customer provides mobile number during registration, THEN the System SHALL store it as optional field

### Requirement 2: Customer Authentication

**User Story:** As a registered customer, I want to log in with my email and password, so that I can access my cart and order history.

#### Acceptance Criteria

1. WHEN a customer submits valid login credentials, THEN the System SHALL verify the password against the stored Password_Hash using bcrypt
2. WHEN a customer submits valid credentials, THEN the System SHALL generate a JWT_Token with user ID, email, and role='CUSTOMER' in the payload
3. WHEN a customer submits invalid credentials, THEN the System SHALL reject the login and return unauthorized error
4. WHEN a customer accesses protected endpoints, THEN the System SHALL validate the JWT_Token signature and expiration
5. WHEN a customer's JWT_Token expires, THEN the System SHALL reject authenticated requests and require re-login
6. THE System SHALL use constant-time password comparison to prevent timing attacks

### Requirement 3: Admin Authentication

**User Story:** As an administrator, I want to log in with my admin credentials, so that I can manage products and orders.

#### Acceptance Criteria

1. WHEN an Admin submits valid login credentials, THEN the System SHALL verify the password and generate JWT_Token with role='ADMIN'
2. WHEN an Admin accesses admin endpoints, THEN the System SHALL validate JWT_Token and verify role='ADMIN'
3. WHEN a non-Admin user attempts to access admin endpoints, THEN the System SHALL reject the request with forbidden error
4. THE System SHALL use the same authentication mechanism (JWT + bcrypt) for both Admin and Customer roles

### Requirement 4: Product Catalog Browsing

**User Story:** As a customer, I want to browse the product catalog with filtering and sorting options, so that I can find die-cast cars matching my interests.

#### Acceptance Criteria

1. WHEN a customer requests the product listing, THEN the System SHALL return only Active_Products with is_active=TRUE
2. WHEN a customer applies search query, THEN the System SHALL match against product name, brand, series, and model (case-insensitive)
3. WHEN a customer filters by brand, THEN the System SHALL return only products matching that brand (case-insensitive)
4. WHEN a customer filters by category, THEN the System SHALL return only products in that Category
5. WHEN a customer filters by price range (min_price, max_price), THEN the System SHALL return products within inclusive bounds
6. WHEN a customer filters by in_stock=TRUE, THEN the System SHALL return only products with Stock_Quantity > 0
7. WHEN a customer requests sorted results, THEN the System SHALL order by price_asc, price_desc, name_asc, name_desc, newest, or oldest
8. THE System SHALL paginate results with configurable page and limit (max 100 items per page)
9. WHEN the System returns product listings, THEN each product SHALL include front_package_image_url for grid display
10. THE System SHALL return pagination metadata including total count and total pages

### Requirement 5: Product Details Display

**User Story:** As a customer, I want to view detailed product information with both package images, so that I can make informed purchase decisions.

#### Acceptance Criteria

1. WHEN a customer requests product details, THEN the System SHALL return complete product information including name, brand, series, model, description, price, Stock_Quantity, scale, and material
2. THE System SHALL return both front_package_image_url and back_package_image_url for the Dual_Image_Constraint
3. WHEN a customer views product details, THEN the System SHALL display stock availability status
4. WHEN Stock_Quantity is 0, THEN the System SHALL indicate out-of-stock status
5. THE System SHALL return Category information with the product

### Requirement 6: Shopping Cart Management

**User Story:** As a customer, I want to add products to my cart, update quantities, and remove items, so that I can prepare for checkout.

#### Acceptance Criteria

1. WHEN a customer adds a product to Cart, THEN the System SHALL validate that Stock_Quantity >= requested quantity
2. WHEN a customer adds a product already in Cart, THEN the System SHALL increment the existing Cart_Item quantity
3. WHEN incrementing Cart_Item quantity would exceed Stock_Quantity, THEN the System SHALL reject the operation
4. WHEN a customer updates Cart_Item quantity, THEN the System SHALL validate against current Stock_Quantity
5. WHEN a customer removes a Cart_Item, THEN the System SHALL delete the item from the Cart
6. WHEN a customer clears the Cart, THEN the System SHALL delete all Cart_Items for that customer
7. THE System SHALL enforce uniqueness constraint: one Cart_Item per (user_id, product_id) pair
8. WHEN the System returns Cart contents, THEN it SHALL calculate subtotal for each Cart_Item and total for entire Cart
9. WHEN a customer adds an inactive product (is_active=FALSE) to Cart, THEN the System SHALL reject the operation

### Requirement 7: Cart Stock Validation

**User Story:** As a customer, I want real-time stock validation for my cart, so that I don't attempt checkout with unavailable items.

#### Acceptance Criteria

1. WHEN a customer views Cart, THEN the System SHALL display current Stock_Quantity for each product
2. WHEN Stock_Quantity changes and is less than Cart_Item quantity, THEN the System SHALL flag the item during checkout validation
3. WHEN a customer proceeds to checkout, THEN the System SHALL validate all Cart_Items against current Stock_Quantity
4. WHEN any Cart_Item exceeds Stock_Quantity, THEN the System SHALL block checkout and return specific out-of-stock items
5. WHEN a product in Cart becomes inactive (is_active=FALSE), THEN the System SHALL block checkout and require removal

### Requirement 8: Order Creation and Checkout

**User Story:** As a customer, I want to complete checkout by providing delivery address, so that my cart items become a confirmed order.

#### Acceptance Criteria

1. WHEN a customer submits checkout with Delivery_Address, THEN the System SHALL validate all required fields (full_name, mobile, address_line, city, state, pincode)
2. WHEN a customer submits valid checkout, THEN the System SHALL begin an atomic database transaction
3. WHEN creating an Order, THEN the System SHALL validate Stock_Quantity for all Cart_Items before proceeding
4. WHEN creating an Order, THEN the System SHALL generate a unique order_number with format "CC{YYYYMMDD}{sequence}"
5. WHEN creating an Order, THEN the System SHALL calculate total_amount as sum of (Cart_Item.product.price × Cart_Item.quantity)
6. WHEN creating an Order, THEN the System SHALL create Order record with status='PENDING'
7. WHEN creating an Order, THEN the System SHALL create Order_Items from Cart_Items with unit_price and subtotal snapshots
8. WHEN creating an Order, THEN the System SHALL create Delivery_Address record linked to the Order
9. WHEN creating an Order, THEN the System SHALL decrement Stock_Quantity for each product by ordered quantity
10. WHEN creating an Order, THEN the System SHALL delete all Cart_Items for the customer
11. WHEN Order creation succeeds, THEN the System SHALL commit the transaction and return Order details
12. WHEN any step in Order creation fails, THEN the System SHALL rollback the transaction and preserve Cart state
13. IF Stock_Quantity becomes insufficient during Order creation, THEN the System SHALL rollback and return specific out-of-stock items

### Requirement 9: Order History and Tracking

**User Story:** As a customer, I want to view my order history and track order status, so that I can monitor my purchases.

#### Acceptance Criteria

1. WHEN a customer requests order history, THEN the System SHALL return only orders where user_id matches the customer
2. THE System SHALL paginate order history with configurable page and limit
3. WHEN a customer filters orders by Order_Status, THEN the System SHALL return matching orders
4. WHEN a customer requests order details, THEN the System SHALL return complete Order including Order_Items, Delivery_Address, and current Order_Status
5. WHEN displaying Order_Items, THEN the System SHALL show product name, brand, quantity, unit_price, and subtotal
6. THE System SHALL prevent customers from viewing orders belonging to other customers

### Requirement 10: Admin Product Management - Creation

**User Story:** As an administrator, I want to create new products with dual package images, so that customers can browse and purchase them.

#### Acceptance Criteria

1. WHEN an Admin uploads a new product, THEN the System SHALL require both front_package_image and back_package_image files
2. WHEN an Admin uploads product images, THEN the System SHALL validate file format is JPEG, PNG, or WebP
3. WHEN an Admin uploads product images, THEN the System SHALL validate file size <= 5MB per image
4. WHEN image validation passes, THEN the System SHALL generate a unique product UUID
5. WHEN uploading images, THEN the System SHALL upload front_package_image to S3_Storage at products/{uuid}/front_package.{ext}
6. WHEN uploading images, THEN the System SHALL upload back_package_image to S3_Storage at products/{uuid}/back_package.{ext}
7. WHEN S3 uploads complete, THEN the System SHALL construct CloudFront_CDN URLs for both images
8. WHEN creating product record, THEN the System SHALL store front_package_image_url and back_package_image_url from S3
9. WHEN creating product, THEN the System SHALL validate price >= 0
10. WHEN creating product, THEN the System SHALL validate Stock_Quantity >= 0
11. WHEN creating product, THEN the System SHALL set is_active=TRUE by default
12. WHEN creating product, THEN the System SHALL validate Category exists before linking
13. IF any S3 upload fails, THEN the System SHALL cleanup partial uploads and rollback database transaction

### Requirement 11: Admin Product Management - Updates and Deletion

**User Story:** As an administrator, I want to update product details and manage product availability, so that I can maintain accurate catalog information.

#### Acceptance Criteria

1. WHEN an Admin updates a product, THEN the System SHALL allow modification of name, brand, series, model, description, price, Stock_Quantity, scale, material, and Category
2. WHEN an Admin uploads new product images during update, THEN the System SHALL follow the same validation and S3 upload process as creation
3. WHEN an Admin uploads new front_package_image only, THEN the System SHALL replace only that image in S3_Storage
4. WHEN an Admin uploads new back_package_image only, THEN the System SHALL replace only that image in S3_Storage
5. WHEN an Admin deletes a product, THEN the System SHALL perform soft delete by setting is_active=FALSE
6. WHEN a product is soft deleted, THEN the System SHALL exclude it from customer Product_Catalog queries
7. WHEN an Admin views product list, THEN the System SHALL include both active and inactive products with is_active indicator
8. THE System SHALL update product updated_at timestamp on any modification

### Requirement 12: Admin Order Management

**User Story:** As an administrator, I want to view all orders and update their status, so that I can manage the fulfillment process.

#### Acceptance Criteria

1. WHEN an Admin requests order list, THEN the System SHALL return all orders regardless of customer ownership
2. WHEN an Admin filters orders by Order_Status, THEN the System SHALL return matching orders
3. WHEN an Admin filters orders by date range (date_from, date_to), THEN the System SHALL return orders within that range
4. WHEN an Admin searches orders by order_number or customer name, THEN the System SHALL return matching results
5. WHEN an Admin views order details, THEN the System SHALL include customer information, Order_Items, and Delivery_Address
6. WHEN an Admin updates Order_Status, THEN the System SHALL validate the transition is allowed from current status
7. WHEN Order_Status is PENDING, THEN Admin SHALL be able to transition to CONFIRMED or CANCELLED
8. WHEN Order_Status is CONFIRMED, THEN Admin SHALL be able to transition to PACKED or CANCELLED
9. WHEN Order_Status is PACKED, THEN Admin SHALL be able to transition to OUT_FOR_DELIVERY or CANCELLED
10. WHEN Order_Status is OUT_FOR_DELIVERY, THEN Admin SHALL be able to transition to DELIVERED or CANCELLED
11. WHEN Order_Status transitions to CANCELLED, THEN the System SHALL restore Stock_Quantity for all Order_Items
12. THE System SHALL update order updated_at timestamp when Order_Status changes

### Requirement 13: Admin Dashboard Analytics

**User Story:** As an administrator, I want to view dashboard statistics, so that I can monitor platform performance and business metrics.

#### Acceptance Criteria

1. WHEN an Admin requests dashboard stats, THEN the System SHALL calculate total_products count
2. WHEN calculating dashboard stats, THEN the System SHALL calculate total_stock as sum of all Stock_Quantity values
3. WHEN calculating dashboard stats, THEN the System SHALL count orders grouped by Order_Status
4. WHEN calculating dashboard stats, THEN the System SHALL calculate total revenue as sum of all Order.total_amount where status != CANCELLED
5. WHEN calculating dashboard stats, THEN the System SHALL calculate revenue for current month
6. WHEN calculating dashboard stats, THEN the System SHALL calculate revenue for current week
7. WHEN displaying dashboard, THEN the System SHALL show recent orders (e.g., latest 10)

### Requirement 14: Category Management

**User Story:** As a customer, I want to browse products by category, so that I can find specific types of die-cast cars.

#### Acceptance Criteria

1. THE System SHALL provide a list of all Category options with name, slug, and description
2. WHEN displaying Category list, THEN the System SHALL include product_count for each Category
3. WHEN a customer filters by Category slug, THEN the System SHALL return products where category_id matches
4. THE System SHALL maintain unique constraints on Category name and slug

### Requirement 15: Password Security

**User Story:** As a platform operator, I want secure password storage and authentication, so that user accounts are protected.

#### Acceptance Criteria

1. WHEN a user (Customer or Admin) creates a password, THEN the System SHALL hash it using bcrypt with cost factor 12
2. THE System SHALL generate a unique salt for each password hash
3. THE System SHALL store only the Password_Hash, never plain-text passwords
4. WHEN verifying passwords, THEN the System SHALL use bcrypt.verify for constant-time comparison
5. THE System SHALL enforce minimum password length of 8 characters
6. THE Password_Hash SHALL be exactly 60 characters and start with "$2b$"

### Requirement 16: JWT Token Management

**User Story:** As a platform operator, I want secure token-based authentication, so that user sessions are protected and scalable.

#### Acceptance Criteria

1. WHEN generating JWT_Token, THEN the System SHALL include user_id (sub), email, and role in payload
2. WHEN generating JWT_Token, THEN the System SHALL set expiration to 7 days from issuance (iat + 7 days)
3. WHEN generating JWT_Token, THEN the System SHALL sign using HS256 algorithm with secret key from AWS Secrets Manager
4. WHEN validating JWT_Token, THEN the System SHALL verify signature using the same secret key
5. WHEN JWT_Token is expired, THEN the System SHALL reject authentication and return unauthorized error
6. WHEN JWT_Token signature is invalid, THEN the System SHALL reject authentication
7. THE System SHALL extract user_id and role from validated JWT_Token for authorization checks

### Requirement 17: Input Validation and Security

**User Story:** As a platform operator, I want comprehensive input validation, so that the system is protected from malicious inputs and data corruption.

#### Acceptance Criteria

1. THE System SHALL validate all API inputs using Pydantic schemas before processing
2. WHEN email is provided, THEN the System SHALL validate format using standard email regex
3. WHEN price is provided, THEN the System SHALL validate it is numeric and >= 0
4. WHEN Stock_Quantity is provided, THEN the System SHALL validate it is integer and >= 0
5. WHEN pagination parameters are provided, THEN the System SHALL enforce page >= 1 and limit <= 100
6. THE System SHALL use parameterized queries via SQLAlchemy ORM to prevent SQL injection
7. WHEN file uploads are received, THEN the System SHALL validate content-type headers match actual file format
8. WHEN Search_Query contains special characters, THEN the System SHALL properly escape them in database queries

### Requirement 18: Product Image Storage and Delivery

**User Story:** As a platform operator, I want scalable and fast image delivery, so that customers experience quick page loads globally.

#### Acceptance Criteria

1. THE System SHALL store all product images in S3_Storage with private bucket access
2. WHEN storing images, THEN the System SHALL organize by products/{product_uuid}/ prefix
3. THE System SHALL serve images through CloudFront_CDN for global distribution
4. WHEN generating image URLs, THEN the System SHALL use CloudFront_CDN domain, not direct S3 URLs
5. THE System SHALL set CloudFront cache TTL to 1 year for product images
6. WHEN uploading to S3, THEN the System SHALL set Content-Type metadata from file type
7. WHEN uploading to S3, THEN the System SHALL set Cache-Control header to max-age=31536000
8. WHEN Admin deletes a product, THEN the System SHALL optionally delete associated S3 images

### Requirement 19: Database Constraints and Integrity

**User Story:** As a platform operator, I want database-level constraints, so that data integrity is maintained even if application logic fails.

#### Acceptance Criteria

1. THE System SHALL enforce UNIQUE constraint on users(email)
2. THE System SHALL enforce UNIQUE constraint on orders(order_number)
3. THE System SHALL enforce UNIQUE constraint on cart_items(user_id, product_id)
4. THE System SHALL enforce UNIQUE constraint on categories(name) and categories(slug)
5. THE System SHALL enforce CHECK constraint: products.price >= 0
6. THE System SHALL enforce CHECK constraint: products.stock_quantity >= 0
7. THE System SHALL enforce CHECK constraint: orders.total_amount >= 0
8. THE System SHALL enforce CHECK constraint: order_items.quantity > 0
9. THE System SHALL enforce CHECK constraint: users.role IN ('ADMIN', 'CUSTOMER')
10. THE System SHALL enforce CHECK constraint: orders.status IN ('PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')
11. THE System SHALL enforce FOREIGN KEY constraint: products.category_id REFERENCES categories(id)
12. THE System SHALL enforce FOREIGN KEY constraint: cart_items.user_id REFERENCES users(id) with CASCADE delete
13. THE System SHALL enforce FOREIGN KEY constraint: orders.user_id REFERENCES users(id)
14. THE System SHALL enforce NOT NULL constraint on products.front_package_image_url
15. THE System SHALL enforce NOT NULL constraint on products.back_package_image_url

### Requirement 20: Responsive UI Design

**User Story:** As a customer, I want the website to work seamlessly on my mobile device, tablet, and desktop, so that I can shop from any device.

#### Acceptance Criteria

1. THE System SHALL render product grid with 1 column on mobile (< 640px), 2 columns on tablet (640px-1024px), and 4 columns on desktop (> 1024px)
2. WHEN displaying on mobile, THEN the System SHALL use hamburger navigation menu
3. WHEN displaying on desktop, THEN the System SHALL use horizontal navigation bar
4. THE System SHALL use responsive images with appropriate sizes for device resolution
5. WHEN displaying product images, THEN the System SHALL lazy load images outside viewport
6. THE System SHALL maintain touch-friendly button sizes (minimum 44x44px) on mobile
7. THE System SHALL use viewport meta tag for proper mobile scaling

### Requirement 21: Premium Brand Identity

**User Story:** As a platform operator, I want a distinctive premium automotive aesthetic, so that the brand stands out in the collectibles market.

#### Acceptance Criteria

1. THE System SHALL use Deep Navy (#0f172a) as primary background color
2. THE System SHALL use Electric Blue (#2563eb) as primary action color
3. THE System SHALL use KTM Orange (#ea580c) as accent color for prices and CTAs
4. THE System SHALL use "Inter" font family for body text and "Rajdhani" for display headers
5. WHEN displaying product cards, THEN the System SHALL show blue border that transitions to orange on hover
6. WHEN displaying prices, THEN the System SHALL render in orange with bold font weight
7. THE System SHALL maintain consistent color scheme across all pages and components

### Requirement 22: Error Handling and User Feedback

**User Story:** As a user (Customer or Admin), I want clear error messages and feedback, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN validation fails, THEN the System SHALL return HTTP 400 with descriptive error messages
2. WHEN authentication fails, THEN the System SHALL return HTTP 401 with "Invalid credentials" or "Token expired" message
3. WHEN authorization fails, THEN the System SHALL return HTTP 403 with "Insufficient permissions" message
4. WHEN resource not found, THEN the System SHALL return HTTP 404 with "Resource not found" message
5. WHEN conflict occurs (e.g., duplicate email), THEN the System SHALL return HTTP 409 with specific conflict details
6. WHEN server error occurs, THEN the System SHALL return HTTP 500 without exposing internal implementation details
7. WHEN Stock_Quantity validation fails during checkout, THEN the System SHALL return specific product names and available quantities
8. THE System SHALL use consistent error response format: { error: { code, message, details } }

### Requirement 23: Performance Requirements

**User Story:** As a customer, I want fast page loads and responsive interactions, so that shopping is smooth and enjoyable.

#### Acceptance Criteria

1. WHEN requesting product listings with filters, THEN the System SHALL respond within 200ms (excluding network latency)
2. WHEN performing cart operations, THEN the System SHALL respond within 100ms
3. WHEN creating an Order, THEN the System SHALL complete the transaction within 300ms
4. WHEN requesting images through CloudFront_CDN, THEN cache hits SHALL be served within 50ms
5. THE System SHALL use database indexes on products(brand), products(category_id), products(price), orders(user_id), and orders(status)
6. THE System SHALL use composite index on cart_items(user_id, product_id)
7. THE System SHALL use database connection pooling with pool size of 20 connections

### Requirement 24: API Pagination

**User Story:** As a developer integrating with the API, I want consistent pagination across all list endpoints, so that I can efficiently load large datasets.

#### Acceptance Criteria

1. WHEN requesting paginated lists, THEN the System SHALL accept page (default: 1) and limit (default: 20, max: 100) parameters
2. WHEN returning paginated results, THEN the System SHALL include pagination metadata with page, limit, total, and total_pages
3. THE System SHALL calculate total_pages as CEILING(total / limit)
4. THE System SHALL apply pagination using OFFSET and LIMIT in database queries
5. WHEN page exceeds total_pages, THEN the System SHALL return empty results array with valid pagination metadata

### Requirement 25: Order Number Generation

**User Story:** As an administrator, I want unique and traceable order numbers, so that I can efficiently manage and reference orders.

#### Acceptance Criteria

1. WHEN creating an Order, THEN the System SHALL generate order_number with format "CC{YYYYMMDD}{sequence}"
2. THE sequence component SHALL be a 3-digit zero-padded number (001-999)
3. WHEN generating order_number, THEN the System SHALL query for latest order_number with same date prefix
4. WHEN no orders exist for current date, THEN the System SHALL start sequence at 001
5. WHEN orders exist for current date, THEN the System SHALL increment the highest sequence by 1
6. THE System SHALL enforce UNIQUE constraint on orders(order_number) to prevent duplicates

### Requirement 26: Stock Quantity Management

**User Story:** As a platform operator, I want accurate stock tracking, so that overselling is prevented and inventory is reliable.

#### Acceptance Criteria

1. THE System SHALL maintain Stock_Quantity >= 0 for all products at all times
2. WHEN an Order is created, THEN the System SHALL atomically decrement Stock_Quantity by ordered quantities
3. WHEN an Order status transitions to CANCELLED, THEN the System SHALL restore Stock_Quantity by adding back ordered quantities
4. WHEN Stock_Quantity reaches 0, THEN the System SHALL prevent adding product to Cart
5. WHEN Stock_Quantity changes, THEN the System SHALL reflect the change immediately in product listings and details
6. THE System SHALL use database transactions to ensure Stock_Quantity updates are atomic with Order creation

### Requirement 27: Session Management

**User Story:** As a customer, I want my authentication to persist across browser sessions, so that I don't need to log in repeatedly.

#### Acceptance Criteria

1. WHEN a customer logs in, THEN the System SHALL return JWT_Token that the frontend stores in localStorage
2. WHEN the frontend makes authenticated requests, THEN it SHALL include JWT_Token in Authorization header with "Bearer" scheme
3. WHEN JWT_Token expires after 7 days, THEN the System SHALL require customer to log in again
4. WHEN a customer logs out, THEN the frontend SHALL remove JWT_Token from localStorage
5. THE System SHALL not maintain server-side session state (stateless authentication)

### Requirement 28: Product Availability Filtering

**User Story:** As a customer, I want to filter products by availability, so that I only see items I can actually purchase.

#### Acceptance Criteria

1. WHEN a customer sets in_stock=TRUE filter, THEN the System SHALL return only products where Stock_Quantity > 0
2. WHEN displaying product cards, THEN the System SHALL show stock availability (e.g., "5 in stock" or "Out of stock")
3. WHEN Stock_Quantity is 0, THEN the System SHALL disable "Add to Cart" button and show "OUT OF STOCK" overlay
4. WHEN product is inactive (is_active=FALSE), THEN the System SHALL exclude it from customer Product_Catalog regardless of Stock_Quantity

### Requirement 29: Delivery Address Validation

**User Story:** As a platform operator, I want complete delivery address data, so that orders can be fulfilled successfully.

#### Acceptance Criteria

1. WHEN a customer submits checkout, THEN the System SHALL validate Delivery_Address contains non-empty full_name
2. WHEN a customer submits checkout, THEN the System SHALL validate Delivery_Address contains non-empty mobile
3. WHEN a customer submits checkout, THEN the System SHALL validate Delivery_Address contains non-empty address_line
4. WHEN a customer submits checkout, THEN the System SHALL validate Delivery_Address contains non-empty city
5. WHEN a customer submits checkout, THEN the System SHALL validate Delivery_Address contains non-empty state
6. WHEN a customer submits checkout, THEN the System SHALL validate Delivery_Address contains non-empty pincode
7. THE System SHALL store Delivery_Address as a separate record linked to Order with foreign key

### Requirement 30: Image Toggle UI Component

**User Story:** As a customer viewing product details, I want to toggle between front and back package images, so that I can see the complete product packaging.

#### Acceptance Criteria

1. WHEN displaying product details, THEN the System SHALL show one image at a time (front or back) in the main display area
2. THE System SHALL default to showing front_package_image when product details load
3. WHEN a customer clicks "Front Package" button, THEN the System SHALL display front_package_image_url
4. WHEN a customer clicks "Back Package" button, THEN the System SHALL display back_package_image_url
5. THE System SHALL visually indicate which image is currently displayed (e.g., active button state)
6. THE System SHALL show thumbnail previews of both images below the main display
7. WHEN a customer clicks a thumbnail, THEN the System SHALL switch to that image in the main display
