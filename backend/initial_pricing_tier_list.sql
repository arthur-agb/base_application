INSERT INTO users.user_plans (
    plan_id,
    name,
    description,
    base_price,
    currency,
    billing_frequency,
    is_active,
    start_date,
    end_date,
    created_at,
    updated_at
)
VALUES
(
    '779fe505-9574-4237-aa1b-639d50b76426',
    'Free Tier',
    'A basic, free plan with limited features.',
    0,
    'GBP',
    'MONTHLY',
    TRUE,
    '2025-08-22 14:50:16.035',
    NULL, -- 'end_date' is empty, so we use NULL
    '2025-08-22 14:50:16.035',
    '2025-08-22 14:50:16.035'
),
(
    '16a1abe5-a9bc-4ece-be46-86eec4623f75',
    'Pro Tier',
    'Advanced features for professional use.',
    9.99,
    'GBP',
    'MONTHLY',
    TRUE,
    '2025-08-22 14:50:16.035',
    NULL, -- 'end_date' is empty, so we use NULL
    '2025-08-22 14:50:16.035',
    '2025-08-22 14:50:16.035'
),
(
    'fa9f02a5-15c5-4d8c-a384-87f36093acac',
    'Pro Annual Tier',
    'Advanced features for professional use.',
    89.99,
    'GBP',
    'YEARLY',
    TRUE,
    '2025-08-22 14:50:16.035',
    NULL, -- 'end_date' is empty, so we use NULL
    '2025-08-22 14:50:16.035',
    '2025-08-22 14:50:16.035'
);