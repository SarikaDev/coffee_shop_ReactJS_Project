CREATE POLICY "users can update own profile" ON app.profiles FOR
UPDATE
    TO authenticated USING (auth.uid() = id) -- Can only update their own rows
    WITH CHECK (
        auth.uid() = id -- Must remain their own row
        AND email IS NOT DISTINCT
        FROM
            OLD.email
            AND loyalty_points IS NOT DISTINCT
        FROM
            OLD.loyalty_points
            AND total_orders IS NOT DISTINCT
        FROM
            OLD.total_orders
            AND total_spent IS NOT DISTINCT
        FROM
            OLD.total_spent
    );