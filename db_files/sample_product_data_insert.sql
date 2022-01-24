USE first_test_db;

INSERT INTO salesdata VALUES(
	NULL, -- order_id
    "SO-EU-0000054", -- order_name
    "2020-07-26T11:09:22+01:00", -- date_created
    "retail", -- sales_chanel
    "EUR", -- iso_currency
    50079.13, -- subtotal
    0, -- discount_amt
    0, -- shipping_amt
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO taxes VALUES (
	NULL, -- tax_id
    LAST_INSERT_ID(), -- order_id
    "20% VAT", -- tax_string
    0, -- tax_amount
    "exempt" -- tax-type
);

UPDATE salesdata SET taxes=last_insert_id() WHERE order_id=last_insert_id();

INSERT INTO line_items VALUES (
	NULL, -- line_item_id
    LAST_INSERT_ID(), -- order_id
    "PL-WIDGET001", -- item_sku
    1 -- item_quantity
),
(
	NULL, -- tax_id
    LAST_INSERT_ID(), -- order_id
    "MC-WIDGET001", -- item_sku
    10 -- item_quantity
);

UPDATE salesdata SET line_items=last_insert_id() WHERE order_id=last_insert_id();

INSERT INTO fulfillments VALUES (
	NULL, -- fulfillment_id
    LAST_INSERT_ID(), -- order_id
    "Marseilles", -- city
    "FR", -- country_code
    "Dekker", -- service
    NULL, -- tracking_id
    "2020-07-29T17:22:18+01:00" -- date_fulfilled
),
(
	NULL, -- fulfillment_id
    LAST_INSERT_ID(), -- order_id
    "Marseilles", -- city
    "FR", -- country_code
    "UPS", -- service
    "1Z1234567890223", -- tracking_id
    "2020-07-26T17:50:38+01:00" -- date_fulfilled
);

UPDATE salesdata SET fulfillments=last_insert_id() WHERE order_id=last_insert_id();

INSERT INTO payments VALUES (
	NULL, -- payment_id
    LAST_INSERT_ID(), -- order_id
    "creditcard", -- payment_type
    5007.91, -- payment_amout
    "2020-07-26T11:10:03+01:00" -- payment_date
),
(
	NULL, -- payment_id
    LAST_INSERT_ID(), -- order_id
    "wirepayment", -- payment_type
    45071.22, -- payment_amout
    "2020-08-26T14:22:01+01:00" -- payment_date
);

UPDATE salesdata SET payments=last_insert_id() WHERE order_id=last_insert_id();
















