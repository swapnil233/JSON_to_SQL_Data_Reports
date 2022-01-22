// Creating the salesData table:

/*
CREATE TABLE `heroku_06cf010c9c84850`.`salesdata` (
    `order_id` VARCHAR(40) NOT NULL,
    `date_created` VARCHAR(45) NOT NULL,
    `sales_channel` VARCHAR(45) NOT NULL,
    `iso_currency` VARCHAR(10) NOT NULL,
    `subtotal` FLOAT NOT NULL,
    `discount_amt` FLOAT NOT NULL,
    `shipping_amt` FLOAT NOT NULL,
    `total_taxes_amt` FLOAT NOT NULL,
    `tax_type` VARCHAR(10) NOT NULL,
    `total` FLOAT NOT NULL,
    `num_items_ordered` INT NOT NULL,
    `num_fulfillments` INT NOT NULL,
    `num_payments` INT NOT NULL,
    PRIMARY KEY (`order_id`),
    UNIQUE INDEX `order_id_UNIQUE` (`order_id` ASC));
*/