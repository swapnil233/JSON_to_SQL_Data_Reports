USE heroku_06cf010c9c84850;

INSERT INTO product VALUES (
	NULL,
	"WIDGET003", -- product_name
	"80012345678901", -- barcode
	NULL, -- parent_sku
	3, -- region_code
	"Starter", -- item_type
	"Nanogrid Limited", -- supplier
	"Nanoleaf", -- brand
	NULL, -- pack_data
	NULL, -- price_data
	"Awesome WIDGETA Starter Kit", -- variant_name
	"Inner Case of WIDGETA Starter Kit. For sale in Canada and the United States only.", -- short_description
	"products/nanoleaf-widget-one-starter-kit/", -- stock_link
	"2020-10-04T15:13:19-04:00" -- last_updated
);

INSERT INTO pack_data VALUES (
	NULL,
	1, -- product_id
	"single", -- pack_type
	NULL, -- components_id FOREIGN KEY
	NULL, -- metric_id FOREIGN KEY
	NULL -- imperial_id FOREIGN KEY
);

UPDATE product SET pack_data = 1 WHERE product_id = 1;

INSERT INTO components VALUES (
	NULL, -- pack_id
    1, -- product_id
    "COMP001", -- component_name
    1 -- quantity
), (
	NULL,
	1, -- product_id
    "COMP002", -- component_name
    3
);

UPDATE pack_data SET components_id = 1 WHERE pack_id = 1;

INSERT INTO metric VALUES (
	NULL,
	100, -- lmm
    100, -- wmm
    100, -- hmm
    1000, -- gwg
    860, -- nwg
    0.001 -- cbm
);

UPDATE pack_data SET metric_id = 1 WHERE pack_id = 1;

INSERT INTO imperial VALUES (
	NULL,
    3.93701,
    3.93701,
    3.93701,
    2.20462,
    1.89598,
    0.035
);

UPDATE pack_data SET imperial_id = 1 WHERE pack_id = 1;

INSERT INTO price_data VALUES (
	NULL,
    1,
    16,
    17.12,
    17.12,
    17.12,
    69.99,
    59.99,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    469.99
);

UPDATE product SET price_data = 1 WHERE product_id = 1;
















