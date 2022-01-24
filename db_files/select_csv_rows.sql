USE heroku_06cf010c9c84850;

Select 
product.product_id, 
product.product_name as sku, 
product.barcode, 
product.parent_sku, 
product.region_code, 
product.item_type, 
product.supplier, 
product.brand,
product.variant_name, 
product.short_description,
pack_data.pack_type, 
components.component_name, 	
components.amount, 
metric.lmm,
metric.wmm,
metric.hmm,
metric.gwg,
metric.nwg,
metric.cbm,
imperial.lin,
imperial.win,
imperial.hin,
imperial.gwlb,
imperial.nwlb,
imperial.cbft, 
price_data.buy_bomUSD,
price_data.buy_canadaUSD,
price_data.buy_franceUSD,
price_data.buy_hongkongUSD,
price_data.sell_CAD,
price_data.sell_USD,
price_data.sell_GBP,
price_data.sell_EUR,
price_data.sell_AUD,
price_data.sell_NZD,
price_data.sell_SGD,
price_data.sell_HKD

FROM product 
LEFT JOIN pack_data ON product.product_id = pack_data.product_id
LEFT JOIN components ON components.product_id = product.product_id 
LEFT JOIN metric ON metric.metric_id = product.product_id 
LEFT JOIN imperial ON imperial.imperial_id = product.product_id LEFT JOIN price_data ON price_data.product_id = product.product_id











