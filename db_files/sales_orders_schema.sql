DROP SCHEMA IF EXISTS heroku_06cf010c9c84850;
CREATE SCHEMA heroku_06cf010c9c84850;
USE heroku_06cf010c9c84850;

CREATE TABLE salesdata (
	order_id INT PRIMARY KEY AUTO_INCREMENT,
    order_name varchar(40) NOT NULL,
	date_created varchar(45) NOT NULL,
	sales_channel varchar(45) NOT NULL,
	iso_currency varchar(10) NOT NULL,
	subtotal float NOT NULL,
	discount_amt float NOT NULL,
	shipping_amt float NOT NULL,
    taxes INT,
    line_items INT,
    fulfillments INT,
    payments INT
);

CREATE TABLE taxes (
	tax_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    tax_string VARCHAR(50),
    tax_amount FLOAT,
    tax_type VARCHAR(50),
    
    FOREIGN KEY (order_id) REFERENCES salesdata(order_id) ON DELETE CASCADE
);

ALTER TABLE salesdata 
ADD FOREIGN KEY (taxes) REFERENCES taxes(tax_id)
ON DELETE CASCADE;

CREATE TABLE line_items(
	line_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    item_sku VARCHAR(50) NOT NULL,
    item_quantity INT NOT NULL,
    
    FOREIGN KEY (order_id) REFERENCES salesdata(order_id) ON DELETE CASCADE
);

ALTER TABLE salesdata 
ADD FOREIGN KEY (line_items) REFERENCES line_items(line_item_id)
ON DELETE CASCADE;

CREATE TABLE fulfillments(
	fulfillment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    city VARCHAR(50) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    service VARCHAR(50) NOT NULL,
    tracking_id VARCHAR(100),
    date_fulfilled DATE NOT NULL,
    
    FOREIGN KEY (order_id) REFERENCES salesdata(order_id) ON DELETE CASCADE
);

ALTER TABLE salesdata 
ADD FOREIGN KEY (fulfillments) REFERENCES fulfillments(fulfillment_id)
ON DELETE CASCADE;

CREATE TABLE payments(
	payment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    payment_amout FLOAT NOT NULL,
    payment_date DATE NOT NULL,
    
    FOREIGN KEY (order_id) REFERENCES salesdata(order_id) ON DELETE CASCADE
);

ALTER TABLE salesdata 
ADD FOREIGN KEY (payments) REFERENCES payments(payment_id)
ON DELETE CASCADE;















