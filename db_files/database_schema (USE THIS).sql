DROP SCHEMA IF EXISTS heroku_06cf010c9c84850;
CREATE SCHEMA heroku_06cf010c9c84850;
USE heroku_06cf010c9c84850;

CREATE TABLE marketingdata(
	week_number INT PRIMARY KEY NOT NULL,
    date_created DATE NOT NULL,
    web_visitors INT NOT NULL,
    pr_clippings INT NOT NULL
);

CREATE TABLE salesdata (
  date_created varchar(45) NOT NULL,
  order_name varchar(40) NOT NULL,
  sales_channel varchar(45) NOT NULL,
  iso_currency varchar(10) NOT NULL,
  subtotal float NOT NULL,
  discount_amt float NOT NULL,
  shipping_amt float NOT NULL,
  total_taxes_amt float NOT NULL,
  tax_type varchar(10) NOT NULL,
  total float NOT NULL,
  num_items_ordered int(11) NOT NULL,
  num_fulfillments int(11) NOT NULL,
  num_payments int(11) NOT NULL,
  PRIMARY KEY (date_created),
  UNIQUE KEY order_name_UNIQUE (order_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE product (
	product_id INT PRIMARY KEY AUTO_INCREMENT,
	product_name VARCHAR(255),
    barcode VARCHAR(255) NOT NULL,
    parent_sku VARCHAR(255),
    region_code INT NOT NULL,
    item_type VARCHAR(40) NOT NULL,
    supplier VARCHAR(40) NOT NULL,
    brand VARCHAR(40) NOT NULL,
    -- Each product has nested pack data, so pack_data will be another table.
    pack_data INT,
    -- Each product has nested price data, so price_data will be another table.
    price_data INT,
    variant_name VARCHAR(255) NOT NULL,
    short_description TEXT NOT NULL,
    stock_link VARCHAR(255) NOT NULL,
    last_updated DATE
);

CREATE TABLE pack_data(
	pack_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
	pack_type VARCHAR(40),
    -- Foreign key components_id will reference components_id components table
    components_id INT,
    -- Foreign key metric_id will reference metric_id inside the metric table
    metric_id INT,
    -- Foreign key imperial_id will reference metric_id inside the imperial table
    imperial_id INT
);

-- Alter the product table to now make pack_data a foreign key that points to the pack_id inside pack_data table
ALTER TABLE product
ADD FOREIGN KEY (pack_data) 
REFERENCES pack_data(pack_id) 
ON DELETE CASCADE;

CREATE TABLE components(
	components_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT,
    component_name VARCHAR(50) NOT NULL,
    amount INT NOT NULL,
    
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
);

-- Now that the components table has been created, alter the pack_data table and change pack_data(components_id) from INT to a FOREIGN KEY which references components(components_id)
ALTER TABLE pack_data
ADD FOREIGN KEY (components_id)
REFERENCES components(components_id)
ON DELETE CASCADE;

CREATE TABLE metric(
	metric_id INT PRIMARY KEY AUTO_INCREMENT,
    lmm FLOAT,
    wmm FLOAT,
    hmm FLOAT,
    gwg FLOAT,
    nwg FLOAT,
    cbm FLOAT
);

ALTER TABLE pack_data
ADD FOREIGN KEY (metric_id)
REFERENCES metric(metric_id)
ON DELETE CASCADE;

CREATE TABLE imperial(
	imperial_id INT PRIMARY KEY AUTO_INCREMENT,
    lin FLOAT,
    win FLOAT,
    hin FLOAT,
    gwlb FLOAT,
    nwlb FLOAT,
    cbft FLOAT
);

ALTER TABLE pack_data
ADD FOREIGN KEY (imperial_id)
REFERENCES imperial(imperial_id)
ON DELETE CASCADE;

CREATE TABLE price_data (
	price_data_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    buy_bomUSD INT DEFAULT NULL,
    buy_canadaUSD FLOAT DEFAULT NULL,
    buy_franceUSD FLOAT DEFAULT NULL,
    buy_hongkongUSD FLOAT DEFAULT NULL,
    sell_CAD FLOAT DEFAULT NULL,
    sell_USD FLOAT DEFAULT NULL,
    sell_GBP FLOAT DEFAULT NULL,
    sell_EUR FLOAT DEFAULT NULL,
    sell_AUD FLOAT DEFAULT NULL,
    sell_NZD FLOAT DEFAULT NULL,
    sell_SGD FLOAT DEFAULT NULL,
    sell_HKD FLOAT DEFAULT NULL,
    
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
);

-- Alter the product table to now make price_data a foreign key that references the price_data_id inside price_data table
ALTER TABLE product
ADD FOREIGN KEY (price_data) 
REFERENCES price_data(price_data_id) 
ON DELETE CASCADE;








