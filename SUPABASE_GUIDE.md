# Supabase CLI Guide ⚡

We have successfully integrated the Supabase CLI into your project! This allows you to manage database changes efficiently without manual SQL execution.

## 🚀 Pushing Changes to Remote

To apply your new migrations (like the `advanced_features` one we just created) to your live Supabase database, run:

```bash
npx supabase db push
```

*Note: You may be prompted to enter your Supabase database password.*

## 🛠️ Creating New Migrations

When you need to make future database changes:

1.  **Generate a new migration file:**
    ```bash
    npx supabase migration new <migration_name>
    ```
    *Example: `npx supabase migration new add_products_table`*

2.  **Edit the generated file** in `supabase/migrations/` and paste your SQL there.

3.  **Push the changes:**
    ```bash
    npx supabase db push
    ```

## 🐛 Troubleshooting

-   **PowerShell Users:** If you see "running scripts is disabled", try running commands with `cmd /c` prefix, e.g., `cmd /c "npx supabase db push"`.
-   **Link Project:** Run this command to connect your project:
    ```bash
    npx supabase link --project-ref cntiqdbfclkytbxrilid
    ```
    *Enter your DB password when prompted.*
