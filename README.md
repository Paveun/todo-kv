# Todo API - Deno, Hono, and Deno KV

This is a simple Todo API built using Deno, the Hono web framework, and Deno KV for persistent storage. It demonstrates a basic CRUD (Create, Read, Update, Delete) API with Basic Authentication.

## Features

*   **Create Todos:** Add new todos with a `text` field.
*   **Read Todos:** Retrieve a list of all todos.
*   **Update Todos:** Modify the `text` and `completed` status of existing todos.
*   **Delete Todos:** Remove todos by ID.
*   **Basic Authentication:** Protects the API with username/password authentication.
*   **Deno KV:** Uses Deno KV for data persistence.

## Prerequisites

*   [Deno](https://deno.land/) (version 2 or later)

## Local Development

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Create a `.env` file:**

    Create a `.env` file in the root of the project and add your Basic Authentication credentials:

    ```
    BASIC_AUTH_USERNAME=your_username
    BASIC_AUTH_PASSWORD=your_password
    ```

    **Important:** Do *not* commit the `.env` file to version control.  It is included in the `.gitignore`.

3.  **Run the application:**

    ```bash
    deno task start
    ```
    or
    ```bash
    deno run --allow-net --allow-env --allow-read --allow-write main.ts
    ```
   This starts the server, typically on `http://localhost:8000`.  The `--allow-net`, `--allow-env`, `--allow-read` and `--allow-write` flags grant the necessary permissions. If you are using a `deno.jsonc` or `deno.json` file, these are not needed.

4. **Run Tests**
   ```bash
   deno test --allow-net --allow-env --allow-read --allow-write