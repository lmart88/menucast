# MenuCast System Architecture & Data Contracts

## 1. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Figma Environment
        FP[Figma Plugin UI]
        FS[Figma Sandbox Plugin Code]
        FP <--> FS
    end

    subgraph MenuCast Web Server [Next.js App Router]
        API_AUTH[/api/token/]
        API_TV_LIST[/api/tv/list/]
        API_PAIR[/api/tv/pair/]
        API_UPLOAD[/api/menu/upload/]
        API_PUSH[/api/menu/push/]
        DASH[Web Dashboard /dashboard]
        PAIR_PAGE[Pairing Portal /pair]
    end

    subgraph TV Clients [Displays]
        WEB_TV[Web Display /tv]
        ATV[Android TV / Fire TV App]
        ATV -->|Embedded WebView| WEB_TV
    end

    subgraph Supabase Cloud
        DB[(PostgreSQL DB)]
        STORAGE[(Supabase Storage 'menus')]
        REALTIME[Supabase Realtime WebSocket]
    end

    %% Flows
    FP -->|Bearer Auth / Fetch TVs| API_TV_LIST
    API_TV_LIST -->|Query TVs| DB

    FS -->|Export PNG Bytes| FP
    FP -->|Request Upload URL| API_UPLOAD
    API_UPLOAD -->|Signed URL| FP
    FP -->|Direct Upload (PUT)| STORAGE
    FP -->|Trigger Push| API_PUSH

    API_PUSH -->|Record Push & Update TV| DB
    API_PUSH -->|Broadcast 'menu:push'| REALTIME
    REALTIME -.->|WebSocket Push| WEB_TV
    WEB_TV -->|Fetch New Menu Image| STORAGE

    WEB_TV -->|Request Pairing Code| API_PAIR
    PAIR_PAGE -->|Claim Code| API_PAIR
    API_PAIR -->|Broadcast 'tv:paired'| REALTIME
    REALTIME -.->|Pairing Confirmation| WEB_TV
```

---

## 2. Cross-Component Workflows

### A. Screen Pairing Lifecycle
1. **Initiation**: The TV display navigates to `/tv`. If not previously paired (checked in `localStorage`), it calls `POST /api/tv/init`.
2. **Pairing Code**: Server generates an 8-character human-readable code (e.g. `PINE-4821`).
3. **Display State**: The TV client displays the pairing code and a QR code pointing to `https://<domain>/pair?code=<pairing_code>` and subscribes to Supabase Realtime channel `pairing:<pairing_code>`.
4. **User Claims Screen**: The user logs in to the Web Dashboard or opens `/pair`, submits the pairing code, and assigns a name (e.g., "Bar Counter TV").
5. **Pairing Confirmation**: `POST /api/tv/pair` updates the database and broadcasts the `tv:paired` event over `pairing:<pairing_code>` with the new `tv_id`.
6. **Screen Metadata Handshake**: The TV client transitions to `displaying` / `paired` state, saves its `tv_id` in `localStorage`, and posts its hardware specs (width, height, aspect ratio, orientation) to `POST /api/tv/screen-info`.

### B. Figma 1-Click Push Workflow
1. **Authentication**: In Figma, user opens the MenuCast plugin, enters their API Token (generated in `/dashboard`).
2. **Fetch Screens**: Plugin queries `GET /api/tv/list` to populate target TVs with their hardware aspect ratios and resolutions.
3. **Frame Setup (Optional)**: User clicks "Create Matched Frame on Canvas", generating a Figma frame pre-configured to the TV's exact resolution (e.g. 1920×1080).
4. **Export & Upload**:
   - Plugin main thread exports the selected frame to a 2x PNG byte array.
   - UI thread calls `POST /api/menu/upload` with `Bearer <token>` to obtain a signed Supabase storage upload URL.
   - Plugin uploads the binary directly to Supabase Storage via `PUT`.
5. **Realtime Broadcast**:
   - Plugin calls `POST /api/menu/push` with `tv_id`, `image_url`, and `menu_mode`.
   - Web server saves push history in `menus` table, updates `current_menu_url` on `tvs`, and sends a broadcast message `menu:push` to channel `tv:<tv_id>`.
6. **Seamless Client Render**:
   - The TV display receives the `menu:push` event via Realtime WebSocket.
   - Pre-loads the incoming image in the background.
   - Executes an 800ms hardware-accelerated crossfade into the new image.

---

## 3. Database Schema

### `tvs` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | Unique TV ID |
| `user_id` | UUID | FK `auth.users(id)` ON DELETE CASCADE | Owner of the TV |
| `name` | TEXT | NOT NULL, DEFAULT `'My TV'` | Display label |
| `pairing_code` | TEXT | UNIQUE, NOT NULL | Pairing identifier |
| `paired_at` | TIMESTAMPTZ | NULL | Timestamp of initial pairing |
| `current_menu_url` | TEXT | NULL | Active menu image URL |
| `screen_width` | INT | NULL | Physical display width in pixels |
| `screen_height` | INT | NULL | Physical display height in pixels |
| `aspect_ratio` | TEXT | NULL | e.g. `'16:9'`, `'9:16'`, `'4:3'` |
| `orientation` | TEXT | NULL | `'Landscape'` or `'Portrait'` |
| `menu_mode` | TEXT | DEFAULT `'static'` | `'static'`, `'hybrid'`, `'responsive'` |
| `menu_data` | JSONB | NULL | Structured layout / price data |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | Record creation timestamp |

### `menus` Table (Push History)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | Unique push ID |
| `tv_id` | UUID | FK `tvs(id)` ON DELETE CASCADE | Target TV screen |
| `image_url` | TEXT | NOT NULL | Public CDN URL of the rendered menu |
| `menu_mode` | TEXT | DEFAULT `'static'` | Rendering mode |
| `menu_data` | JSONB | NULL | Metadata snapshot at push time |
| `pushed_at` | TIMESTAMPTZ | DEFAULT `now()` | Push timestamp |
| `pushed_by` | UUID | FK `auth.users(id)` | User or token owner |

### `api_tokens` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | Unique token ID |
| `user_id` | UUID | FK `auth.users(id)` ON DELETE CASCADE | Associated user account |
| `token` | TEXT | UNIQUE, NOT NULL | 64-character hex secret |
| `name` | TEXT | NOT NULL, DEFAULT `'Figma Plugin'` | Token name |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | Creation date |
| `last_used_at` | TIMESTAMPTZ | NULL | Last API request date |

---

## 4. API Endpoints Reference

| Route | Method | Auth | Payload / Params | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `/api/tv/init` | `POST` | None | `{}` | Generates a new pairing code for unauthenticated TV |
| `/api/tv/status` | `GET` | None | `?code=...` or `?tv_id=...` | Checks whether TV is paired and returns current menu |
| `/api/tv/pair` | `POST` | Session | `{ pairing_code, tv_name }` | Claims a TV code and pairs it to user account |
| `/api/tv/screen-info` | `POST` | None | `{ tv_id, screen_width, screen_height, aspect_ratio, orientation }` | Telemetry from TV client |
| `/api/tv/list` | `GET` | Bearer or Session | None | Lists all paired TVs for authenticated user |
| `/api/tv/delete` | `POST` | Session | `{ tv_id }` | Unpairs and deletes TV |
| `/api/menu/upload` | `POST` | Bearer or Session | `{ tv_id, file_name, content_type }` | Generates signed storage upload URL |
| `/api/menu/push` | `POST` | Bearer or Session | `{ tv_id, image_url, menu_mode, menu_data }` | Broadcasts menu update to TV |
| `/api/menu/clear` | `POST` | Session | `{ tv_id }` | Clears active menu on screen |
| `/api/token` | `POST` / `GET` | Session | None | Generates or fetches user's API token |
