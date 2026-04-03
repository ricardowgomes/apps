CREATE TABLE IF NOT EXISTS categories (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	icon TEXT NOT NULL DEFAULT '',
	color TEXT NOT NULL DEFAULT '#6366f1',
	-- JSON array of lowercase keyword strings used for auto-categorisation
	keywords TEXT NOT NULL DEFAULT '[]',
	created_at TEXT NOT NULL
);

-- Seed default categories (INSERT OR IGNORE so re-running is safe)
INSERT OR IGNORE INTO categories (id, name, icon, color, keywords, created_at) VALUES
	('cat_salary',        'Salary',          '💰', '#10b981', '["salary","payroll","direct deposit","paycheque","paystub"]',                    datetime('now')),
	('cat_freelance',     'Freelance',        '💼', '#06b6d4', '["freelance","invoice","consulting","contract","self-employed"]',                 datetime('now')),
	('cat_investment',    'Investment',       '📈', '#8b5cf6', '["dividend","interest","transfer","etf","stock","investing","tfsa","rrsp"]',       datetime('now')),
	('cat_rental',        'Rental Income',   '🏠', '#f59e0b', '["rent received","rental income","tenant"]',                                       datetime('now')),
	('cat_food',          'Food & Dining',   '🍔', '#ef4444', '["restaurant","café","cafe","coffee","tim hortons","mcdonald","burger","pizza","sushi","pho","bar","pub","doordash","uber eats","skip","grubhub","dine"]', datetime('now')),
	('cat_groceries',     'Groceries',        '🛒', '#22c55e', '["grocery","groceries","superstore","walmart","costco","loblaws","metro","iga","sobeys","whole foods","farm boy","freshco","no frills","food basics"]',  datetime('now')),
	('cat_transport',     'Transport',        '🚗', '#3b82f6', '["gas","fuel","shell","esso","petro","uber","lyft","taxi","transit","presto","go train","via rail","parking","autoroute","car wash","mechanic","tires"]', datetime('now')),
	('cat_utilities',     'Utilities',        '💡', '#eab308', '["hydro","electricity","water","gas bill","internet","rogers","bell","telus","fido","koodo","videotron","phone","wireless","cable","utility"]',           datetime('now')),
	('cat_housing',       'Housing',          '🏡', '#f97316', '["rent","mortgage","condo fee","strata","property tax","maintenance","repair","home insurance","moving"]',                                                 datetime('now')),
	('cat_healthcare',    'Healthcare',       '🏥', '#ec4899', '["pharmacy","drugstore","shopper","rexall","dentist","doctor","clinic","optician","physio","therapy","prescription","hospital","medical"]',                datetime('now')),
	('cat_entertainment', 'Entertainment',    '🎬', '#a855f7', '["netflix","spotify","apple","disney","prime","cinema","movie","theatre","concert","ticket","gaming","steam","xbox","playstation","nintendo"]',            datetime('now')),
	('cat_shopping',      'Shopping',         '🛍️', '#06b6d4', '["amazon","ebay","shopify","zara","h&m","uniqlo","ikea","bestbuy","canadian tire","home depot","staples","clothing","shoes","apparel"]',                  datetime('now')),
	('cat_education',     'Education',        '📚', '#6366f1', '["tuition","university","college","udemy","coursera","textbook","school","student","course","training"]',                                                  datetime('now')),
	('cat_travel',        'Travel',           '✈️', '#14b8a6', '["airbnb","hotel","flight","airline","westjet","air canada","expedia","booking","hostel","vacation","trip","travel"]',                                    datetime('now')),
	('cat_uncategorized', 'Uncategorized',    '❓', '#6b7280', '[]',                                                                                                                                                         datetime('now'));
