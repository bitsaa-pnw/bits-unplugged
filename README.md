# Contact Hub

Contact Hub is a web application designed to display contact information, allow users to favorite contacts, and save contact details as vCards. It features a modern, responsive design using Tailwind CSS and integrates QR code scanning functionality for easy contact loading.

## Motivation

This app serves as a practical tool for efficient contact sharing and management, particularly in professional and social networking scenarios. For instance, during networking events, instead of exchanging physical business cards or manually typing contact details, one can simply display their unique QR code for others to scan. This allows for quick and accurate transfer of information, minimizing errors and enhancing the overall networking experience. Users can then easily save received contacts as vCards or add them to a personal favorites list for later follow-up.

## Features

* **Interactive Contact Card**: View contact details on a digital card that flips to reveal more information.
* **QR Code Scanning**: Scan QR codes to quickly load contact profiles based on an embedded ID.
* **Favorite Contacts**: Mark contacts as favorites, with data persistently stored in local storage for easy access.
* **Save Contact (vCard)**: Generate and download contact information as a vCard (.vcf) file, compatible with most contact management applications.
* **Tabbed Interface**: Easily switch between the "Contact Card" view and a list of "Favorited Contacts".
* **Dynamic Data Loading**: Configurable to load contact data from either an internal debug dataset or a Google Spreadsheet.

## Technologies Used

* **HTML5**: Structure of the web page.
* **Tailwind CSS**: Utility-first CSS framework for styling and responsive design.
* **JavaScript**: Core logic for interactivity, data handling, and DOM manipulation.
* **html5-qrcode library**: For QR code scanning capabilities.

## Setup and Installation

To set up and run the Contact Hub application, follow these steps:

1.  **Save the File**: Save the provided HTML content into a file named `index.html` in your local directory.
2.  **Open in Browser**: Open the `index.html` file in any modern web browser.

### Configuration

The application can load contact data from two sources:

1.  **Debug Mode (Default)**: Uses a hardcoded JSON dataset for demonstration purposes.
2.  **Google Spreadsheet**: Fetches data from a publicly published Google Spreadsheet in TSV (Tab Separated Values) format.

To switch between modes and configure your data source:

1.  **Open `index.html`**: Open the `index.html` file in a text editor.
2.  **Locate Configuration Variables**: Find the following lines within the `<script>` tag:

    ```javascript
    const DEBUG_MODE = false;
    const googleSpreadsheetTSVUrl = 'YOUR_GOOGLE_SPREADSHEET_TSV_URL_HERE';
    ```

3.  **To use Debug Data**: Set `DEBUG_MODE` to `true`. When `DEBUG_MODE` is `true`, the application might also automatically seed up to 4 random contacts as favorites if your local storage is empty. No further configuration is needed for the URL.
4.  **To use Google Spreadsheet Data**:
    * Set `DEBUG_MODE` to `false`.
    * Replace `'YOUR_GOOGLE_SPREADSHEET_TSV_URL_HERE'` with the actual TSV URL of your Google Spreadsheet.
    * **Important**: Your Google Spreadsheet must be published to the web in TSV format. The URL typically looks like: `https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/export?format=tsv&gid=YOUR_SHEET_GID`
    * Ensure your spreadsheet columns match the expected keys in the JavaScript code (e.g., `id`, `display name`, `subtitle`, `contact number`, `email`, `linkedin_id`, `instagram_id`).

### Google Spreadsheet Interaction Details

When `DEBUG_MODE` is set to `false`, the application interacts with a Google Spreadsheet to fetch contact data. Here's how it works:

1.  **Data Fetching**: The `fetchAndProcessData` function makes an HTTP request to the `googleSpreadsheetTSVUrl` using the `fetch` API.
2.  **TSV Parsing**: The fetched plain text data (TSV) is split into lines, and the first line is treated as headers (column names). Each subsequent line is split by tabs to get the values for each row.
3.  **Object Mapping**: For each row, the values are mapped to an object using the retrieved column headers as keys. Empty values are converted to empty strings.
4.  **Error Handling**: If the fetch operation fails (e.g., network error, incorrect URL, or spreadsheet not published publicly) or the TSV structure is invalid, an error message is displayed to the user.

## Usage

### Contact Card View

* **Loading Contacts**:
    * **By URL**: Append `?id=X` to the URL (e.g., `index.html?id=1`) to load a specific contact from your dataset. In debug mode, if no ID is provided, it defaults to ID '1'.
    * **By QR Scan**: Click the "Scan Contact QR" button to activate your camera and scan a QR code containing a URL with an `id` parameter (e.g., `http://your-domain.com/index.html?id=4`).
* **Flipping the Card**: Click anywhere on the contact card (except the buttons) to flip it and reveal more details (contact number, email, social media links) and actions.
* **Saving Contact**: Once the card is flipped, click the "Save Contact" button to download the contact's information as a vCard (.vcf) file.
* **Favoriting Contact**: Click the "Favorite" button to add the current contact to your favorites list. The button text and icon will change to indicate it's favorited.

### Favorited Contacts View

* Click the "Favorited Contacts" tab to view a list of all contacts you have marked as favorites.
* **Unfavorite**: Click the "Unfavorite" button next to a contact in the list to remove it from your favorites.
* **View Card**: Click the "View Card" button next to a contact in the list to switch back to the "Contact Card" tab and display that contact's detailed card.

## Data Structure

The application expects contact data to be an array of objects, where each object represents a contact with the following keys:

* `id`: (String) Unique identifier for the contact.
* `display name`: (String) The primary name displayed on the card.
* `subtitle`: (String, optional) A secondary descriptive text.
* `contact number`: (String, optional) Phone number.
* `email`: (String, optional) Email address.
* `linkedin_id`: (String, optional) LinkedIn profile ID (e.g., `alice_w`).
* `instagram_id`: (String, optional) Instagram handle (e.g., `alice_insta`).

Example Debug Data Structure:

```json
[
    { "id": "1", "display name": "Alice Wonderland", "subtitle": "Curious Explorer", "contact number": "111-222-3333", "email": "alice@example.com", "linkedin_id": "alice_w", "instagram_id": "alice_insta" },
    { "id": "2", "display name": "Bob The Builder", "subtitle": "Can We Fix It?", "contact number": "", "email": "bob@example.com", "linkedin_id": "", "instagram_id": "bob_builds" }
]
```

## Local Storage

Favorited contacts are stored in your browser's local storage using the key `favoritedContactIds`. This ensures that your favorited contacts persist even after closing and reopening the browser.

## VCard Generation

When you click "Save Contact," the application dynamically generates a vCard (version 3.0) from the displayed contact's details. It includes the contact's name, phone number, email, and social media URLs if available. The generated file is then downloaded with a `.vcf` extension.
