let html5QrCode = null;
let allContactsData = [];
let eventData = {}; // Global variable to store event.yaml data

window.onload = function() {
    // Configuration: Set this to 'true' to use the hardcoded debug data.
    // Set to 'false' to fetch from the Google Spreadsheet URL.
    const DEBUG_MODE = false;

    // Local Storage Keys for configuration and favorites
    const SPREADSHEET_ID_STORAGE_KEY = 'contactHub_spreadsheetId';
    const SHEET_GID_STORAGE_KEY = 'contactHub_sheetGid';
    const FORM_ID_STORAGE_KEY = 'contactHub_formId';
    const FAVORITES_STORAGE_KEY = 'favoritedContactIds';
    const user_key = "drgukjdddljjfrbkfhrhnijhknhrvevi";

    // Helper functions to get/set values from Local Storage
    function getStoredSpreadsheetId() {
        return localStorage.getItem(SPREADSHEET_ID_STORAGE_KEY);
    }
    function setStoredSpreadsheetId(id) {
        localStorage.setItem(SPREADSHEET_ID_STORAGE_KEY, id);
    }
    function getStoredSheetGid() {
        return localStorage.getItem(SHEET_GID_STORAGE_KEY);
    }
    function setStoredSheetGid(gid) {
        localStorage.setItem(SHEET_GID_STORAGE_KEY, gid);
    }
    function getStoredFormId() {
        return localStorage.getItem(FORM_ID_STORAGE_KEY);
    }
    function setStoredFormId(id) {
        localStorage.setItem(FORM_ID_STORAGE_KEY, id);
    }

    // Parse URL parameters for spreadsheet ID, sheet GID, form ID, and the main tab
    const urlParams = new URLSearchParams(window.location.search);
    const sidFromUrl = urlParams.get('sid');
    const gidFromUrl = urlParams.get('gid');
    const fidFromUrl = urlParams.get('fid');
    const mainTabFromUrl = urlParams.get('tab'); // Get 'tab' parameter for main tab selection

    let googleSpreadsheetTSVUrl;
    let currentSid;
    let currentGid;
    let currentFormUrl;
    let currentFormId;

    // Logic to determine Google Spreadsheet URL (from URL params or local storage)
    if (sidFromUrl) {
        currentSid = sidFromUrl;
        setStoredSpreadsheetId(sidFromUrl);
        if (gidFromUrl) {
            currentGid = gidFromUrl;
            setStoredSheetGid(gidFromUrl);
        } else {
            currentGid = getStoredSheetGid() || '0'; // Default to '0' if no GID and none stored
        }
    } else {
        currentSid = getStoredSpreadsheetId();
        currentGid = getStoredSheetGid() || '0'; // Use stored gid or default to '0'
    }

    if (currentSid) {
        googleSpreadsheetTSVUrl = `https://docs.google.com/spreadsheets/d/e/${currentSid}/pub?output=tsv&gid=${currentGid}`;
    }

    // Logic to determine Google Form URL (from URL params or local storage)
    if (fidFromUrl) {
        currentFormId = fidFromUrl;
        setStoredFormId(fidFromUrl);
    } else {
        currentFormId = getStoredFormId();
    }

    if (currentFormId) {
        currentFormUrl = `https://docs.google.com/forms/d/e/${currentFormId}/viewform`;
    }

    // Mapping of spreadsheet headers to internal data model keys
    const headerMapping = {
        'Timestamp': 'timestamp',
        'ID': 'id',
        'Display Name': 'display name',
        'Subtitle': 'subtitle',
        'Contact Number': 'contact number',
        'Email Address': 'email',
        'LinkedIn ID': 'linkedin_id',
        'Instagram ID': 'instagram_id'
    };

    // Debug data in JSON format (mimics the structure after parsing TSV)
    const debugJsonData = [
            { id: '1', 'display name': 'Alice Wonderland (Old)', subtitle: 'Curious Explorer', 'contact number': '111-222-3333', email: 'alice@example.com', linkedin_id: 'alice_w', instagram_id: 'alice_insta', timestamp: '2024-01-15T10:00:00Z' },
            { id: '2', 'display name': 'Bob The Builder', subtitle: 'Can We Fix It?', 'contact number': '', email: 'bob@example.com', linkedin_id: '', instagram_id: 'bob_builds', timestamp: '2024-02-20T11:30:00Z' },
            { id: '1', 'display name': 'Alice Wonderland (New)', subtitle: 'Updated Explorer', 'contact number': '111-222-3334', email: 'alice.new@example.com', linkedin_id: 'alice_w_new', instagram_id: 'alice_insta_new', timestamp: '2024-03-01T14:45:00Z' }, // Newer entry for ID 1
            { id: '3', 'display name': 'Charlie Chaplin', subtitle: 'The Little Tramp', 'contact number': '444-555-6666', email: '', linkedin_id: '', instagram_id: '', timestamp: '2024-01-10T09:00:00Z' },
            { id: '4', 'display name': 'Diana Prince', subtitle: 'Amazonian Warrior', 'contact number': '555-123-4567', email: 'diana@example.com', linkedin_id: 'diana_p', instagram_id: 'wonder_woman', timestamp: '2024-04-05T16:00:00Z' },
            { id: '5', 'display name': 'Ethan Hunt', subtitle: 'Impossible Missions', 'contact number': '888-999-0000', email: 'ethan@example.com', linkedin_id: 'ethan_h', instagram_id: 'imf_agent', timestamp: '2024-03-15T08:00:00Z' },
            { id: '6', 'display name': 'Fiona Shrek', subtitle: 'Ogre Princess', 'contact number': '777-666-5555', email: 'fiona@example.com', linkedin_id: 'fiona_s', instagram_id: 'ogre_princess', timestamp: '2024-02-01T13:00:00Z' },
            { id: '7', 'display name': 'Groot', subtitle: 'I Am Groot', 'contact number': '101-202-3030', email: 'groot@example.com', linkedin_id: '', instagram_id: 'we_are_groot', timestamp: '2024-01-25T17:00:00Z' }
        ];

    // --- Main Level Tab Elements ---
    const tabHomeBtn = document.getElementById('tab-home');
    const tabScheduleBtn = document.getElementById('tab-schedule');
    const tabGuestBtn = document.getElementById('tab-guest');

    const homeTabContent = document.getElementById('home-tab-content');
    const scheduleTabContent = document.getElementById('schedule-tab-content');
    const guestTabContent = document.getElementById('guest-tab-content');

    // --- Home Tab Specific Elements ---
    const homeEventName = document.getElementById('home-event-name');
    const eventNameElem = document.getElementById('event-name'); // This is now redundant but kept for clarity in old HTML. It will be removed.
    const eventSubtitleElem = document.getElementById('event-subtitle');
    const eventDescriptionElem = document.getElementById('event-description');
    const eventDateElem = document.getElementById('event-date');
    const eventLocationElem = document.getElementById('event-location');


    // --- Schedule Tab Specific Elements ---
    const scheduleListElem = document.getElementById('schedule-list');


    // --- Guest Tab (Nested Sub-Tab) Elements ---
    const tabContactCardBtn = document.getElementById('tab-contact-card');
    const tabFavoritesBtn = document.getElementById('tab-favorites');
    const contactCardTabContent = document.getElementById('contact-card-tab-content');
    const favoritesTabContent = document.getElementById('favorites-tab-content');

    const tabAllContactsBtn = document.getElementById('tab-all-contacts');
    const allContactsTabContent = document.getElementById('all-contacts-tab-content');
    const allContactsList = document.getElementById('all-contacts-list');
    const noAllContactsMessage = document.getElementById('no-all-contacts-message');
    const allContactsSearchInput = document.getElementById('all-contacts-search');


    // --- Contact Card Specific Elements ---
    const contactCard = document.getElementById('contact-card');
    const cardInner = document.getElementById('card-inner');
    const cardFront = document.getElementById('card-front');
    const cardBack = document.getElementById('card-back');
    const notFoundDiv = document.getElementById('not-found');
    const errorMessageDiv = document.getElementById('error-message');

    const displayNameFrontElem = document.getElementById('display-name-front');
    const subtitleFrontElem = document.getElementById('subtitle-front');

    const displayNameBackElem = document.getElementById('display-name-back');
    const contactNumberRow = document.getElementById('contact-number-row');
    const contactNumberElem = document.getElementById('contact-number');
    const emailRow = document.getElementById('email-row');
    const emailElem = document.getElementById('email');
    const linkedinRow = document.getElementById('linkedin-row');
    const linkedinLink = document.getElementById('linkedin-link');
    const instagramRow = document.getElementById('instagram-row');
    const instagramLink = document.getElementById('instagram-link');
    const saveContactBtn = document.getElementById('save-contact-btn');
    const favoriteBtn = document.getElementById('favorite-btn');
    const favoriteIcon = document.getElementById('favorite-icon');
    const favoriteText = document.getElementById('favorite-text');

    let currentContactData = null; // Stores data for the currently displayed contact card
    let allContactsData = []; // Stores all contacts data once fetched

    // --- Favorites List Elements ---
    const favoritedContactsList = document.getElementById('favorited-contacts-list');
    const noFavoritesMessage = document.getElementById('no-favorites-message');

    // --- QR Scan Elements ---
    const scanQrBtn = document.getElementById('scan-qr-btn');
    const qrReaderDiv = document.getElementById('reader'); // The div where the scanner appears
    const qrScanStatus = document.getElementById('qr-scan-status');

    // --- Redirect Message Elements (for Google Form) ---
    const redirectMessageDiv = document.getElementById('redirect-message');
    const countdownTimerElem = document.getElementById('countdown-timer');
    const editFormLinkElem = document.getElementById('edit-form-link');


    // --- Local Storage Functions for managing favorited contact IDs ---
    function getFavoritedContactIds() {
        try {
            const storedIds = localStorage.getItem(FAVORITES_STORAGE_KEY);
            return storedIds ? JSON.parse(storedIds) : [];
        } catch (e) {
            console.error("Error reading from local storage:", e);
            return [];
        }
    }

    function saveFavoritedContactIds(ids) {
        try {
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
        } catch (e) {
            console.error("Error writing to local storage:", e);
        }
    }

    function isContactFavorited(id) {
        const favoritedIds = getFavoritedContactIds();
        return favoritedIds.includes(id);
    }

    function toggleContactFavorite(id) {
        let favoritedIds = getFavoritedContactIds();
        if (favoritedIds.includes(id)) {
            // Remove from favorites if already present
            favoritedIds = favoritedIds.filter(favId => favId !== id);
            console.log(`Unfavorited contact ID: ${id}`);
        } else {
            // Add to favorites if not present
            favoritedIds.push(id);
            console.log(`Favorited contact ID: ${id}`);
        }
        saveFavoritedContactIds(favoritedIds);

        // Update UI elements related to favoriting
        if (currentContactData && currentContactData.id === id) {
            updateFavoriteButtonState(id); // Update favorite button on the contact card
        }
        if (favoritesTabContent.style.display !== 'none') {
            renderFavoritedContacts(); // Re-render the favorites list if that tab is active
        }
        if (allContactsTabContent.style.display !== 'none') {
            filterAllContacts(); // Re-render all contacts list to update favorite state icons
        }
    }

    function updateFavoriteButtonState(contactId) {
        if (isContactFavorited(contactId)) {
            favoriteIcon.setAttribute('fill', 'gold'); // Filled star icon
            favoriteText.textContent = 'Favorited';
            favoriteBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
            favoriteBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
        } else {
            favoriteIcon.setAttribute('fill', 'currentColor'); // Default color (outline) star icon
            favoriteText.textContent = 'Favorite';
            favoriteBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
            favoriteBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
        }
    }
    // --- End Local Storage Functions for Favorites ---


    // --- General UI Functions for displaying messages ---
    function showErrorMessage(message) {
        // Ensure the contact card tab content is visible to show the error
        contactCardTabContent.style.display = 'block';
        contactCard.style.display = 'none'; // Hide contact card
        notFoundDiv.style.display = 'none'; // Hide not found message
        errorMessageDiv.style.display = 'block'; // Show error message
        errorMessageDiv.querySelector('p:first-child').textContent = message; // Set custom error message
        saveContactBtn.style.display = 'none'; // Hide action buttons
        favoriteBtn.style.display = 'none';
        stopQrScanner(); // Stop scanner if active
    }

    function showNotFoundMessage() {
        // Ensure the contact card tab content is visible
        contactCardTabContent.style.display = 'block';
        contactCard.style.display = 'none'; // Hide contact card
        errorMessageDiv.style.display = 'none'; // Hide generic error
        notFoundDiv.style.display = 'block'; // Show not found message
        saveContactBtn.style.display = 'none'; // Hide action buttons
        favoriteBtn.style.display = 'none';
        stopQrScanner(); // Stop scanner if active
    }

    // Function to generate and download vCard (contact file)
    function generateVCard() {
        if (!currentContactData) {
            console.error("No contact data available to generate vCard.");
            return;
        }

        const name = currentContactData['display name'] || 'Unknown Contact';
        const tel = currentContactData['contact number'] || '';
        const email = currentContactData.email || '';
        const linkedinId = currentContactData.linkedin_id || '';
        const instagramId = currentContactData.instagram_id || '';

        // Construct the vCard string
        let vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\n`;
        if (tel) { vcard += `TEL;TYPE=WORK,VOICE:${tel}\n`; }
        if (email) { vcard += `EMAIL;TYPE=INTERNET:${email}\n`; }
        if (linkedinId) { vcard += `URL;TYPE=LinkedIn:https://www.linkedin.com/in/${linkedinId}\n`; }
        if (instagramId) { vcard += `URL;TYPE=Instagram:https://www.instagram.com/${instagramId}\n`; }
        vcard += `END:VCARD`;

        // Create a Blob and a download link
        const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.replace(/\s+/g, '_')}.vcf`; // Sanitize filename for download
        document.body.appendChild(a);
        a.click(); // Programmatically click the link to trigger download
        document.body.removeChild(a); // Clean up the temporary link
        URL.revokeObjectURL(url); // Release the object URL
    }

    // --- QR Scanner Logic using html5-qrcode library ---
    function startQrScanner() {
        qrReaderDiv.style.display = 'block';
        qrScanStatus.textContent = 'Scanning for QR code...';
        scanQrBtn.style.display = 'none'; // Hide scan button while scanning
        contactCard.style.display = 'none'; // Hide contact card view
        notFoundDiv.style.display = 'none'; // Hide any previous messages
        errorMessageDiv.style.display = 'none';
        redirectMessageDiv.style.display = 'none'; // Hide redirect message if scanner starts

        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("reader"); // Initialize if not already
        }

        // Configuration for the QR scanner (frame rate, scan box size)
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        };

        // Start the QR code scanner, preferring the back camera
        html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess)
            .catch(err => {
                console.error("Failed to start QR scanner:", err);
                qrScanStatus.textContent = `Error starting scanner: ${err.message}`;
                showErrorMessage("Failed to start QR scanner. Please ensure camera access is granted and try again.");
            });
    }

    function stopQrScanner() {
        console.log("Stopping QR scanner...");
        if (html5QrCode && html5QrCode.isScanning) {
            try {
                html5QrCode.stop()
                    .then(() => {
                        console.log("QR scanner stopped.");
                    })
                    .catch((err) => {
                        console.warn("Failed to stop QR scanner:", err);
                    });
            } catch (err) {
                console.warn("Failed to stop QR scanner (sync error):", err);
            }
        }
        qrReaderDiv.style.display = 'none'; // Hide scanner element
        scanQrBtn.style.display = 'flex'; // Show scan button again
        qrScanStatus.textContent = ''; // Clear status message
    }

    function onScanSuccess(decodedText, decodedResult) {
        console.log(`QR Code scanned: ${decodedText}`);
        qrScanStatus.textContent = `QR Code scanned: ${decodedText}`;
        stopQrScanner(); // Stop scanner after successful scan

        try {
            const scannedUrl = new URL(decodedText);
            // Check if the scanned QR code URL belongs to the same origin (this application)
            const isSameOriginIgnoringProtocol = scannedUrl.hostname === window.location.hostname && scannedUrl.port === window.location.port;

            if (isSameOriginIgnoringProtocol) {
                const scannedId = xorDecode(scannedUrl.searchParams.get('id'), user_key);
                const editId = scannedUrl.searchParams.get('edit_id');

                if (scannedId) {
                    qrScanStatus.style.display = 'none';
                    // Ensure the correct main and sub-tabs are active when a contact is scanned
                    switchMainTab('guest');
                    switchGuestSubTab('contact-card');
                    loadContactCard(scannedId);
                } else if (editId) {
                    qrScanStatus.style.display = 'none';
                    // Ensure the correct main and sub-tabs are active for editing
                    switchMainTab('guest');
                    switchGuestSubTab('contact-card');
                    redirectToPrefilledForm(editId);
                } else {
                    qrScanStatus.textContent = "QR code is from this site but no 'id' or 'edit_id' parameter found.";
                    showNotFoundMessage();
                }
            } else {
                qrScanStatus.textContent = `Scanned QR code is not for this website. URL: ${decodedText}`;
                // If the QR is not for this site, still display the contact card if one was loaded
                if (!currentContactData) {
                    showNotFoundMessage();
                } else {
                    contactCard.style.display = 'block';
                    notFoundDiv.style.display = 'none';
                    errorMessageDiv.style.display = 'none';
                }
            }
        } catch (e) {
            qrScanStatus.textContent = "Scanned content is not a valid URL or could not be processed.";
            console.error("Error processing scanned QR code:", e);
            // If there's an error processing, revert to showing existing contact or not found
            if (!currentContactData) {
                showNotFoundMessage();
            } else {
                contactCard.style.display = 'block';
                notFoundDiv.style.display = 'none';
                errorMessageDiv.style.display = 'none';
            }
        }
    }

    // Function to redirect to a prefilled Google Form for editing contact details
    function redirectToPrefilledForm(contactId) {
        if (!currentFormUrl) {
            showErrorMessage("Form ID (fid) not provided in the URL or local storage. Please provide it as a URL parameter (e.g., ?fid=YOUR_FORM_ID) or ensure it was set previously.");
            return;
        }

        // Find the contact data to pre-fill the form
        const contactToEdit = allContactsData.find(contact => contact.id === contactId);

        const googleFormBaseUrl = currentFormUrl;
        // Mapping of internal keys to Google Form entry IDs
        const entryIds = {
            'id': 'entry.425553741',
            'display name': 'entry.1611557554',
            'subtitle': 'entry.1394933389',
            'email': 'entry.1411329335',
            'contact number': 'entry.285755920',
            'linkedin_id': 'entry.76271349',
            'instagram_id': 'entry.1255579483'
        };

        let prefilledUrl = `${googleFormBaseUrl}?usp=pp_url`;

        // Build the prefilled URL by appending each field's value
        for (const key in entryIds) {
            // 'id' field is always from the scanned contactId; other fields from contactToEdit or empty
            const value = (key === 'id') ? contactId : (contactToEdit && contactToEdit[key]) || '';
            prefilledUrl += `&${entryIds[key]}=${encodeURIComponent(value)}`;
        }

        // Load the contact card (will show 'not found' if contactToEdit is null)
        loadContactCard(contactId);
        // Ensure we're on the correct sub-tab to display the contact card
        switchGuestSubTab('contact-card');

        // Display the redirect message and the direct link
        redirectMessageDiv.style.display = 'block';
        editFormLinkElem.href = prefilledUrl;

        let countdown = 5;
        countdownTimerElem.textContent = countdown;

        // Start countdown timer before redirecting
        const interval = setInterval(() => {
            countdown--;
            countdownTimerElem.textContent = countdown;
            if (countdown <= 0) {
                clearInterval(interval);
                window.open(prefilledUrl, '_blank'); // Open the form in a new tab
            }
        }, 1000);

        console.log("Prefilled Google Form link generated:", prefilledUrl);
    }

    // --- Contact Card Logic for displaying a single contact ---
    function loadContactCard(idToLoad) {
        // Reset card state and hide action buttons initially
        contactCard.classList.remove('flipped');
        saveContactBtn.style.display = 'none';
        favoriteBtn.style.display = 'none';
        redirectMessageDiv.style.display = 'none'; // Hide redirect message for new card load

        // Attempt to find the contact in the already loaded data
        const foundContact = allContactsData.find(contact => contact.id === idToLoad);

        if (foundContact) {
            currentContactData = foundContact; // Store the found data

            // Populate the front of the contact card
            displayNameFrontElem.textContent = foundContact['display name'];
            subtitleFrontElem.innerHTML = foundContact['subtitle'] || '';

            // Populate the back of the contact card
            displayNameBackElem.textContent = foundContact['display name'];

            // Conditionally display contact details based on data availability
            if (foundContact['contact number']) {
                contactNumberElem.textContent = foundContact['contact number'];
                contactNumberRow.style.display = 'flex';
            } else {
                contactNumberRow.style.display = 'none';
            }

            if (foundContact.email) {
                emailElem.textContent = foundContact.email;
                emailRow.style.display = 'flex';
            } else {
                emailRow.style.display = 'none';
            }

            if (foundContact.linkedin_id) {
                linkedinLink.textContent = foundContact.linkedin_id;
                linkedinLink.href = `https://www.linkedin.com/in/${foundContact.linkedin_id}`;
                linkedinRow.style.display = 'flex';
            } else {
                linkedinRow.style.display = 'none';
            }

            if (foundContact.instagram_id) {
                instagramLink.textContent = foundContact.instagram_id;
                instagramLink.href = `https://www.instagram.com/${foundContact.instagram_id}`;
                instagramRow.style.display = 'flex';
            } else {
                instagramRow.style.display = 'none';
            }

            contactCard.style.display = 'block'; // Show the contact card
            notFoundDiv.style.display = 'none'; // Hide any not-found or error messages
            errorMessageDiv.style.display = 'none';

            updateFavoriteButtonState(currentContactData.id); // Update favorite button for this contact
        } else {
            showNotFoundMessage(); // If contact not found, display a message
        }
    }

    // --- Favorites List Logic for rendering favorited contacts ---
    function renderFavoritedContacts() {
        favoritedContactsList.innerHTML = ''; // Clear previous list items
        const favoritedIds = getFavoritedContactIds(); // Get IDs of favorited contacts

        if (favoritedIds.length === 0) {
            noFavoritesMessage.style.display = 'block'; // Show message if no favorites
            return;
        } else {
            noFavoritesMessage.style.display = 'none'; // Hide message if there are favorites
        }

        // Filter all contacts data to get only the favorited ones
        const favoritedContacts = allContactsData.filter(contact => favoritedIds.includes(contact.id));

        if (favoritedContacts.length === 0) {
            // This case handles if IDs are stored but the actual contacts are not in allContactsData
            noFavoritesMessage.style.display = 'block';
            return;
        }

        // Render each favorited contact as a list item
        favoritedContacts.forEach(contact => {
            const contactItem = document.createElement('div');
            contactItem.className = 'contact-item bg-gray-50 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between';

            // HTML for each contact item, including contact details and action buttons
            contactItem.innerHTML = `
                <div class="contact-details mb-2 sm:mb-0">
                    <h3 class="text-xl font-semibold text-gray-800">${contact['display name']}</h3>
                    ${contact.subtitle ? `<p class="text-md text-gray-500">${contact.subtitle}</p>` : ''}
                    ${contact['contact number'] ? `<p class="text-sm text-gray-600 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg>${contact['contact number']}</p>` : ''}
                    ${contact.email ? `<p class="text-sm text-gray-600 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>${contact.email}</p>` : ''}
                    ${contact.linkedin_id ? `<p class="text-sm text-gray-600 flex items-center"><svg class="h-4 w-4 mr-1 text-blue-700" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0zM7.35 20.47H3.66V9.1H7.35v11.37zM5.5 7.5a2 2 0 11-.01-4.01A2 2 0 015.5 7.5zm14.97 12.97h-3.69v-5.61c0-1.33-.02-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.96v5.7h-3.69V9.1h3.55v1.64h.05c.49-.93 1.68-1.9 3.48-1.9 3.73 0 4.42 2.45 4.42 5.63v6.05z"/></svg><a href="https://www.linkedin.com/in/${contact.linkedin_id}" target="_blank" class="text-blue-600 hover:underline">${contact.linkedin_id}</a></p>` : ''}
                    ${contact.instagram_id ? `<p class="text-sm text-gray-600 flex items-center"><svg class="h-4 w-4 mr-1 text-pink-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.204-.012 3.584-.07 4.85-0.148 3.252-1.691 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069s-3.584-.012-4.85-.07c-3.252-0.148-4.771-1.691-4.919-4.919-0.058-1.265-0.069-1.645-0.069-4.849 0-3.204.012-3.584.07-4.85 0.148-3.252 1.691-4.771 4.919-4.919 1.265-0.058 1.645-0.069 4.849-0.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.28.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.44-.645 1.44-1.44s-.645-1.44-1.44-1.44z"/></svg><a href="https://www.instagram.com/${contact.instagram_id}" target="_blank" class="text-blue-600 hover:underline">${contact.instagram_id}</a></p>` : ''}
                </div>
                <div class="contact-actions w-full sm:w-auto mt-2 sm:mt-0">
                    <button class="unfavorite-btn px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition duration-300 ease-in-out text-sm" data-id="${contact.id}">Unfavorite</button>
                    <a href="#" class="view-card-link px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300 ease-in-out text-sm flex items-center justify-center" data-id="${contact.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                        </svg>
                        View Card
                    </a>
                </div>
            `;
            favoritedContactsList.appendChild(contactItem);
        });

        // Add event listeners to "Unfavorite" buttons
        document.querySelectorAll('.unfavorite-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const contactId = event.target.dataset.id;
                toggleContactFavorite(contactId); // Toggle favorite status
            });
        });

        // Add event listeners to "View Card" links
        document.querySelectorAll('.view-card-link').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent default link navigation
                const contactId = event.target.dataset.id;
                switchGuestSubTab('contact-card'); // Switch to the Contact Card sub-tab
                loadContactCard(contactId); // Load the specific contact's details
            });
        });
    }

    // --- All Contacts List Logic for rendering all attendees ---
    function renderAllContacts(contactsToRender = allContactsData) {
        allContactsList.innerHTML = ''; // Clear previous list items

        if (contactsToRender.length === 0) {
            noAllContactsMessage.style.display = 'block'; // Show message if no contacts
            return;
        } else {
            noAllContactsMessage.style.display = 'none'; // Hide message if contacts exist
        }

        // Render each contact as a list item
        contactsToRender.forEach(contact => {
            const contactItem = document.createElement('div');
            contactItem.className = 'contact-item bg-gray-50 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between';

            // Reusing the same HTML structure as favorited contacts for consistency
            contactItem.innerHTML = `
                <div class="contact-details mb-2 sm:mb-0">
                    <h3 class="text-xl font-semibold text-gray-800">${contact['display name']}</h3>
                    ${contact.subtitle ? `<p class="text-md text-gray-500">${contact.subtitle}</p>` : ''}
                    ${contact['contact number'] ? `<p class="text-sm text-gray-600 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg>${contact['contact number']}</p>` : ''}
                    ${contact.email ? `<p class="text-sm text-gray-600 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>${contact.email}</p>` : ''}
                    ${contact.linkedin_id ? `<p class="text-sm text-gray-600 flex items-center"><svg class="h-4 w-4 mr-1 text-blue-700" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0zM7.35 20.47H3.66V9.1H7.35v11.37zM5.5 7.5a2 2 0 11-.01-4.01A2 2 0 015.5 7.5zm14.97 12.97h-3.69v-5.61c0-1.33-.02-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.96v5.7h-3.69V9.1h3.55v1.64h.05c.49-.93 1.68-1.9 3.48-1.9 3.73 0 4.42 2.45 4.42 5.63v6.05z"/></svg><a href="https://www.linkedin.com/in/${contact.linkedin_id}" target="_blank" class="text-blue-600 hover:underline">${contact.linkedin_id}</a></p>` : ''}
                    ${contact.instagram_id ? `<p class="text-sm text-gray-600 flex items-center"><svg class="h-4 w-4 mr-1 text-pink-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.204-.012 3.584-.07 4.85-0.148 3.252-1.691 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069s-3.584-.012-4.85-.07c-3.252-0.148-4.771-1.691-4.919-4.919-0.058-1.265-0.069-1.645-0.069-4.849 0-3.204.012-3.584.07-4.85 0.148-3.252 1.691-4.771 4.919-4.919 1.265-0.058 1.645-0.069 4.849-0.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.28.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.44-.645 1.44-1.44s-.645-1.44-1.44-1.44z"/></svg><a href="https://www.instagram.com/${contact.instagram_id}" target="_blank" class="text-blue-600 hover:underline">${contact.instagram_id}</a></p>` : ''}
                </div>
                <div class="contact-actions w-full sm:w-auto mt-2 sm:mt-0">
                    <button class="favorite-toggle-btn px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition duration-300 ease-in-out text-sm flex items-center justify-center" data-id="${contact.id}">
                        <svg class="h-4 w-4 mr-1 favorite-icon" fill="${isContactFavorited(contact.id) ? 'gold' : 'currentColor'}" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" d="M10 18.35L3.618 20l.707-7.071L.293 8.382l7.071-.707L10 1l2.626 6.674 7.071.707-4.032 4.547.707 7.071L10 18.35z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="favorite-text">${isContactFavorited(contact.id) ? 'Favorited' : 'Favorite'}</span>
                    </button>
                    <a href="#" class="view-card-link px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300 ease-in-out text-sm flex items-center justify-center" data-id="${contact.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                        </svg>
                        View Card
                    </a>
                </div>
            `;
            favoritedContactsList.appendChild(contactItem);
        });

        // Add event listeners to "Unfavorite" buttons
        document.querySelectorAll('.unfavorite-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const contactId = event.target.dataset.id;
                toggleContactFavorite(contactId); // Toggle favorite status
            });
        });

        // Add event listeners to "View Card" links
        document.querySelectorAll('.view-card-link').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent default link navigation
                const contactId = event.target.dataset.id;
                switchGuestSubTab('contact-card'); // Switch to the Contact Card sub-tab
                loadContactCard(contactId); // Load the specific contact's details
            });
        });
    }

    // --- All Contacts List Logic for rendering all attendees ---
    function renderAllContacts(contactsToRender = allContactsData) {
        allContactsList.innerHTML = ''; // Clear previous list items

        if (contactsToRender.length === 0) {
            noAllContactsMessage.style.display = 'block'; // Show message if no contacts
            return;
        } else {
            noAllContactsMessage.style.display = 'none'; // Hide message if contacts exist
        }

        // Render each contact as a list item
        contactsToRender.forEach(contact => {
            const contactItem = document.createElement('div');
            contactItem.className = 'contact-item bg-gray-50 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between';

            // Reusing the same HTML structure as favorited contacts for consistency
            contactItem.innerHTML = `
                <div class="contact-details mb-2 sm:mb-0">
                    <h3 class="text-xl font-semibold text-gray-800">${contact['display name']}</h3>
                    ${contact.subtitle ? `<p class="text-md text-gray-500">${contact.subtitle}</p>` : ''}
                    ${contact['contact number'] ? `<p class="text-sm text-gray-600 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg>${contact['contact number']}</p>` : ''}
                    ${contact.email ? `<p class="text-sm text-gray-600 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>${contact.email}</p>` : ''}
                    ${contact.linkedin_id ? `<p class="text-sm text-gray-600 flex items-center"><svg class="h-4 w-4 mr-1 text-blue-700" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0zM7.35 20.47H3.66V9.1H7.35v11.37zM5.5 7.5a2 2 0 11-.01-4.01A2 2 0 015.5 7.5zm14.97 12.97h-3.69v-5.61c0-1.33-.02-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.96v5.7h-3.69V9.1h3.55v1.64h.05c.49-.93 1.68-1.9 3.48-1.9 3.73 0 4.42 2.45 4.42 5.63v6.05z"/></svg><a href="https://www.linkedin.com/in/${contact.linkedin_id}" target="_blank" class="text-blue-600 hover:underline">${contact.linkedin_id}</a></p>` : ''}
                    ${contact.instagram_id ? `<p class="text-sm text-gray-600 flex items-center"><svg class="h-4 w-4 mr-1 text-pink-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.204-.012 3.584-.07 4.85-0.148 3.252-1.691 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069s-3.584-.012-4.85-.07c-3.252-0.148-4.771-1.691-4.919-4.919-0.058-1.265-0.069-1.645-0.069-4.849 0-3.204.012-3.584.07-4.85 0.148-3.252 1.691-4.771 4.919-4.919 1.265-0.058 1.645-0.069 4.849-0.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.28.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.44-.645 1.44-1.44s-.645-1.44-1.44-1.44z"/></svg><a href="https://www.instagram.com/${contact.instagram_id}" target="_blank" class="text-blue-600 hover:underline">${contact.instagram_id}</a></p>` : ''}
                </div>
                <div class="contact-actions w-full sm:w-auto mt-2 sm:mt-0">
                    <button class="favorite-toggle-btn px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition duration-300 ease-in-out text-sm flex items-center justify-center" data-id="${contact.id}">
                        <svg class="h-4 w-4 mr-1 favorite-icon" fill="${isContactFavorited(contact.id) ? 'gold' : 'currentColor'}" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" d="M10 18.35L3.618 20l.707-7.071L.293 8.382l7.071-.707L10 1l2.626 6.674 7.071.707-4.032 4.547.707 7.071L10 18.35z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="favorite-text">${isContactFavorited(contact.id) ? 'Favorited' : 'Favorite'}</span>
                    </button>
                    <a href="#" class="view-card-link px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300 ease-in-out text-sm flex items-center justify-center" data-id="${contact.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                        </svg>
                        View Card
                    </a>
                </div>
            `;
            allContactsList.appendChild(contactItem);
        });

        // Add event listeners to favorite toggle buttons within "All Contacts" tab
        document.querySelectorAll('#all-contacts-list .favorite-toggle-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const contactId = event.target.dataset.id || event.target.closest('button').dataset.id;
                toggleContactFavorite(contactId); // Toggle favorite status
                // Update the button's visual state immediately after toggling
                const icon = button.querySelector('.favorite-icon');
                const text = button.querySelector('.favorite-text');
                if (isContactFavorited(contactId)) {
                    icon.setAttribute('fill', 'gold');
                    text.textContent = 'Favorited';
                } else {
                    icon.setAttribute('fill', 'currentColor');
                    text.textContent = 'Favorite';
                }
            });
        });

        // Add event listeners to "View Card" links within "All Contacts" tab
        document.querySelectorAll('#all-contacts-list .view-card-link').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent default link behavior
                const contactId = event.target.dataset.id;
                switchGuestSubTab('contact-card'); // Switch to Contact Card sub-tab
                loadContactCard(contactId); // Load the specific contact
            });
        });
    }

    // Function to filter contacts based on search input
    function filterAllContacts() {
        const searchTerm = allContactsSearchInput.value.toLowerCase();
        // Filter contacts by display name, subtitle, email, or contact number
        const filtered = allContactsData.filter(contact => {
            return (contact['display name'] && contact['display name'].toLowerCase().includes(searchTerm)) ||
                   (contact.subtitle && contact.subtitle.toLowerCase().includes(searchTerm)) ||
                   (contact.email && contact.email.toLowerCase().includes(searchTerm)) ||
                   (contact['contact number'] && contact['contact number'].includes(searchTerm));
        });
        renderAllContacts(filtered); // Re-render the list with filtered results
    }

    // --- Functions to load and display event.yaml data ---
    async function loadEventData() {
        try {
            const response = await fetch('event.yaml');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const yamlText = await response.text();
            eventData = jsyaml.load(yamlText); // Parse YAML using js-yaml library
            console.log("Loaded event data:", eventData);
            populateHomePage();
            populateSchedulePage();
        } catch (error) {
            console.error("Error loading event.yaml:", error);
            // Optionally display an error message on the home/schedule pages
        }
    }

    function populateHomePage() {
        if (eventData.name) {
            homeEventName.textContent = eventData.name;
            // eventNameElem.textContent = eventData.name; // Redundant, homeEventName is main title
        }
        if (eventData.subtitle) {
            eventSubtitleElem.textContent = eventData.subtitle;
        }
        if (eventData.description) {
            eventDescriptionElem.innerHTML = eventData.description;
        }
        if (eventData.date) {
            eventDateElem.textContent = eventData.date;
        }
        if (eventData.location) {
            // Check if location_link exists and is not null
            if (eventData.location_link && eventData.location_link !== 'null') {
                const locationLink = document.createElement('a');
                locationLink.href = eventData.location_link;
                locationLink.target = "_blank"; // Open in new tab
                locationLink.rel = "noopener noreferrer"; // Security best practice
                locationLink.classList.add('text-blue-600', 'hover:underline');
                locationLink.textContent = eventData.location;
                eventLocationElem.innerHTML = ''; // Clear previous content
                eventLocationElem.appendChild(locationLink);
            } else {
                eventLocationElem.textContent = eventData.location;
            }
        }
    }

    function populateSchedulePage() {
        scheduleListElem.innerHTML = ''; // Clear existing schedule

        if (eventData.schedule && Array.isArray(eventData.schedule)) {
            // For now, assume a single "day" for simplicity, matching the image example
            // You could add dynamic day headers if your YAML structure included dates for each day
            // For example, if eventData had a 'days' array with 'date' and 'schedule'
            const today = new Date();
            const options = { weekday: 'short', month: 'short', day: 'numeric' };
            const formattedDate = today.toLocaleDateString('en-US', options);

            const dayHeader = document.createElement('h2');
            dayHeader.className = 'text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300';
            dayHeader.textContent = formattedDate; // "Sat., May 01" for example
            scheduleListElem.appendChild(dayHeader);


            eventData.schedule.forEach(item => {
                const timelineItem = document.createElement('div');
                timelineItem.className = 'timeline-item';

                const timeDiv = document.createElement('div');
                timeDiv.className = 'timeline-item-time';
                timeDiv.textContent = item['start time'] || ''; // Use 'start time' from YAML

                const contentDiv = document.createElement('div');
                contentDiv.className = 'timeline-item-content';

                const titleElem = document.createElement('h3');
                titleElem.textContent = item.title || 'Untitled Session';
                contentDiv.appendChild(titleElem);

                if (item.subtitle && item.subtitle !== 'null') { // Check for 'null' string specifically
                    const subtitleElem = document.createElement('p');
                    subtitleElem.className = 'subtitle';
                    subtitleElem.textContent = item.subtitle;
                    contentDiv.appendChild(subtitleElem);
                }

                // Add a placeholder for location if you add it to your YAML
                // For example:
                // if (item.location) {
                //     const locationElem = document.createElement('p');
                //     locationElem.className = 'text-sm text-gray-500 flex items-center mt-1';
                //     locationElem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>${item.location}`;
                //     contentDiv.appendChild(locationElem);
                // }


                if (item.description && item.description !== 'null') {
                    const descriptionElem = document.createElement('p');
                    descriptionElem.className = 'description';
                    descriptionElem.textContent = item.description;
                    contentDiv.appendChild(descriptionElem);
                }

                timelineItem.appendChild(timeDiv);
                timelineItem.appendChild(contentDiv);
                scheduleListElem.appendChild(timelineItem);
            });
        } else {
            const noScheduleMsg = document.createElement('p');
            noScheduleMsg.className = 'text-gray-600 text-center mt-4';
            noScheduleMsg.textContent = 'No schedule available.';
            scheduleListElem.appendChild(noScheduleMsg);
        }
    }

    /**
     * "Decodes" a hexadecimal string generated by the Python xor_encode function
     * using a simple XOR operation with a user-provided key.
     *
     * @param {string} encodedHex The hexadecimal string to be "decoded".
     * @param {string} userKey The key to use for "decoding".
     * @returns {string} The "decoded" original string.
     */
    function xorDecode(encodedHex, userKey) {
        if (!encodedHex){
            return encodedHex;
        }
        if (!userKey) {
            console.warn("Warning: User key is empty. Decoding might not be effective.");
            // If no key, assume it was encoded without a key and just convert hex to char
            let decoded = '';
            for (let i = 0; i < encodedHex.length; i += 2) {
                decoded += String.fromCharCode(parseInt(encodedHex.substring(i, i + 2), 16));
            }
            return decoded;
        }

        let decodedChars = [];
        const keyLen = userKey.length;

        // Iterate through the hexadecimal string, taking two characters at a time
        for (let i = 0; i < encodedHex.length; i += 2) {
            // Parse the two-character hex string into an integer (base 16)
            const encodedCharValue = parseInt(encodedHex.substring(i, i + 2), 16);

            // Determine the corresponding key character's ASCII value
            const keyCharValue = userKey.charCodeAt((i / 2) % keyLen);

            // XOR the encoded character value with the key character value
            const xorResult = encodedCharValue ^ keyCharValue;

            // Convert the result back to a character and add to the array
            decodedChars.push(String.fromCharCode(xorResult));
        }
        return decodedChars.join('');
    }


    // --- Data Fetching and Initialization ---
    async function fetchAndProcessData() {
        let dataSourcePromise;
        if (DEBUG_MODE) {
            dataSourcePromise = Promise.resolve(debugJsonData); // Use hardcoded debug data
        } else {
            // Check if Google Spreadsheet URL is configured before attempting fetch
            if (!googleSpreadsheetTSVUrl) {
                showErrorMessage("Visit registration desk to enable guests tab");
                return;
            }
            dataSourcePromise = fetch(googleSpreadsheetTSVUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}. Check if the spreadsheet URL is correct and published publicly.`);
                    }
                    return response.text(); // Get raw TSV text
                })
                .then(tsvText => {
                    const lines = tsvText.trim().split('\n');
                    if (lines.length === 0) {
                        return [];
                    }

                    // Parse headers using the header mapping
                    const headers = lines[0].split('\t').map(header => headerMapping[header.trim()]);
                    const contacts = [];

                    // Parse each line as a contact object
                    for (let i = 1; i < lines.length; i++) {
                        const values = lines[i].split('\t');
                        const contact = {};
                        headers.forEach((header, index) => {
                            contact[header] = values[index] ? values[index].trim() : '';
                        });
                        contacts.push(contact);
                    }
                    console.log("Fetched raw contacts:", contacts);

                    // Remove duplicate contacts based on 'id', keeping the most recent by 'timestamp'
                   const uniqueContacts = {};
                   contacts.forEach(contact => {
                        const existingContact = uniqueContacts[contact.id];
                        if (!existingContact || new Date(contact.timestamp) > new Date(existingContact.timestamp)) {
                            uniqueContacts[contact.id] = contact;
                        }
                    });

                    const filteredData = Object.values(uniqueContacts); // Convert map back to array

                    return filteredData;
                });
        }

        dataSourcePromise
            .then(processedData => {
                console.log("Processed Data (unique and latest):", processedData);
                allContactsData = processedData; // Store the processed data globally

                // --- Debug Mode: Seed Favorites (only if DEBUG_MODE is true and no favorites exist) ---
                if (DEBUG_MODE && getFavoritedContactIds().length === 0) {
                    const availableIds = allContactsData.map(c => c.id);
                    const idsToFavorite = [];
                    const numContactsToFavorite = Math.min(4, availableIds.length); // Max 4 favorites for seeding

                    // Randomly select contacts to favorite
                    let tempAvailableIds = [...availableIds];
                    while (idsToFavorite.length < numContactsToFavorite && tempAvailableIds.length > 0) {
                        const randomIndex = Math.floor(Math.random() * tempAvailableIds.length);
                        const randomId = tempAvailableIds[randomIndex];
                        idsToFavorite.push(randomId);
                        tempAvailableIds.splice(randomIndex, 1); // Remove selected ID to avoid duplicates
                    }
                    saveFavoritedContactIds(idsToFavorite);
                    console.log("DEBUG_MODE: Seeded favorites with IDs:", idsToFavorite);
                }
                // --- End Debug Mode: Seed Favorites ---

                // After data is loaded, check for 'id' or 'edit_id' in URL
                let idFromUrl = xorDecode(new URLSearchParams(window.location.search).get('id'), user_key);
                let editIdFromUrl = new URLSearchParams(window.location.search).get('edit_id');

                // If in DEBUG_MODE and no ID is provided, default to '1' for easy testing
                if (DEBUG_MODE && !idFromUrl && !editIdFromUrl) {
                    idFromUrl = '1';
                    console.log("DEBUG_MODE: No ID or Edit ID found in URL, defaulting to ID '1'.");
                }

                if (idFromUrl) {
                    if(DEBUG_MODE){
                        console.log(`Loading contact card for ID: ${idFromUrl}`);
                    }
                    switchMainTab('guest'); // Automatically switch to 'guest' tab
                    switchGuestSubTab('contact-card'); // And 'contact-card' sub-tab
                    loadContactCard(idFromUrl);
                } else if (editIdFromUrl) {
                    console.log(`Redirecting to Google Form for ID: ${editIdFromUrl}`);
                    switchMainTab('guest'); // Automatically switch to 'guest' tab
                    switchGuestSubTab('contact-card'); // And 'contact-card' sub-tab
                    redirectToPrefilledForm(editIdFromUrl);
                } else {
                    console.log("No specific contact ID or edit ID provided in URL.");
                    // If no specific contact to load, determine initial main tab from URL or default
                     if (mainTabFromUrl) {
                        switchMainTab(mainTabFromUrl);
                     } else {
                        switchMainTab('home'); // Default to 'guests' tab
                        switchGuestSubTab('contact-card'); // And its 'contact-card' sub-tab
                     }
                }
            })
            .catch(error => {
                console.error('Error fetching or processing data:', error);
                showErrorMessage(`Failed to load data: ${error.message}`);
            });
    }

    // --- Main Level Tab Switching Logic (Home, Schedule, Guests) ---
    function switchMainTab(tabName) {
        // Stop QR scanner if active, regardless of which tab is being activated
        stopQrScanner();

        // Deactivate all main tab buttons visually
        tabHomeBtn.classList.remove('border-blue-600', 'text-blue-600');
        tabHomeBtn.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        tabScheduleBtn.classList.remove('border-blue-600', 'text-blue-600');
        tabScheduleBtn.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        tabGuestBtn.classList.remove('border-blue-600', 'text-blue-600');
        tabGuestBtn.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');

        // Hide all main tab content sections
        homeTabContent.style.display = 'none';
        scheduleTabContent.style.display = 'none';
        guestTabContent.style.display = 'none';

        // Activate the selected main tab and show its content
        if (tabName === 'home') {
            tabHomeBtn.classList.add('border-blue-600', 'text-blue-600');
            tabHomeBtn.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            homeTabContent.style.display = 'block';
            populateHomePage(); // Populate home page content from eventData
        } else if (tabName === 'schedule') {
            tabScheduleBtn.classList.add('border-blue-600', 'text-blue-600');
            tabScheduleBtn.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            scheduleTabContent.style.display = 'block';
            populateSchedulePage(); // Populate schedule page content from eventData
        } else if (tabName === 'guest') {
            tabGuestBtn.classList.add('border-blue-600', 'text-blue-600');
            tabGuestBtn.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            guestTabContent.style.display = 'block';
            // When switching to Guests tab, default to showing the 'Contact Card' sub-tab
            switchGuestSubTab('contact-card');
        }

        // Update URL to reflect the currently active main tab
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('tab', tabName);
        window.history.pushState({ path: currentUrl.href }, '', currentUrl.href);
    }

    // --- Guest Sub-Tab Switching Logic (Contact Card, Favorites, All Attendees) ---
    function switchGuestSubTab(tabName) {
        // Stop QR scanner if active
        stopQrScanner();

        // Deactivate all guest sub-tab buttons visually
        tabContactCardBtn.classList.remove('border-blue-600', 'text-blue-600');
        tabContactCardBtn.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        tabFavoritesBtn.classList.remove('border-blue-600', 'text-blue-600');
        tabFavoritesBtn.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        tabAllContactsBtn.classList.remove('border-blue-600', 'text-blue-600');
        tabAllContactsBtn.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');

        // Hide all guest sub-tab content sections
        contactCardTabContent.style.display = 'none';
        favoritesTabContent.style.display = 'none';
        allContactsTabContent.style.display = 'none';

        // Activate the selected guest sub-tab and show its content
        if (tabName === 'contact-card') {
            tabContactCardBtn.classList.add('border-blue-600', 'text-blue-600');
            tabContactCardBtn.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            contactCardTabContent.style.display = 'block';
        } else if (tabName === 'favorites') {
            tabFavoritesBtn.classList.add('border-blue-600', 'text-blue-600');
            tabFavoritesBtn.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            favoritesTabContent.style.display = 'block';
            renderFavoritedContacts(); // Re-render favorites list when tab is opened
        } else if (tabName === 'all-contacts') {
            tabAllContactsBtn.classList.add('border-blue-600', 'text-blue-600');
            tabAllContactsBtn.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            allContactsTabContent.style.display = 'block';
            filterAllContacts(); // Render all contacts (with any existing filter) when tab is opened
        }
    }


    // --- Event Listeners ---
    // Event listener for generating vCard (Save Contact button)
    saveContactBtn.addEventListener('click', generateVCard);

    // Event listener for toggling favorite status
    favoriteBtn.addEventListener('click', () => {
        if (currentContactData && currentContactData.id) {
            toggleContactFavorite(currentContactData.id);
        }
    });

    // Event listener for flipping the contact card
    contactCard.addEventListener('click', (event) => {
        // Prevent flipping if the click originated from a button itself or its children
        if (event.target === saveContactBtn || event.target === favoriteBtn || saveContactBtn.contains(event.target) || favoriteBtn.contains(event.target)) {
            return;
        }
        // Only allow flipping if a contact is loaded and no error/not found is showing
        if (currentContactData) {
            contactCard.classList.toggle('flipped'); // Toggle the 'flipped' class for 3D effect
            // Show/hide action buttons based on flip state (buttons are only on the back)
            if (contactCard.classList.contains('flipped')) {
                saveContactBtn.style.display = 'flex';
                favoriteBtn.style.display = 'flex';
            } else {
                saveContactBtn.style.display = 'none';
                favoriteBtn.style.display = 'none';
            }
        }
    });

    // Event listener for starting the QR scanner
    scanQrBtn.addEventListener('click', startQrScanner);

    // Main tab event listeners
    tabHomeBtn.addEventListener('click', () => switchMainTab('home'));
    tabScheduleBtn.addEventListener('click', () => switchMainTab('schedule'));
    tabGuestBtn.addEventListener('click', () => switchMainTab('guest'));

    // Guest sub-tab event listeners
    tabContactCardBtn.addEventListener('click', () => switchGuestSubTab('contact-card'));
    tabFavoritesBtn.addEventListener('click', () => switchGuestSubTab('favorites'));
    tabAllContactsBtn.addEventListener('click', () => switchGuestSubTab('all-contacts'));

    // Event listener for search input in All Contacts tab
    allContactsSearchInput.addEventListener('input', filterAllContacts);

    // --- Initial Application Setup on Window Load ---
    // Load event data first
    loadEventData().then(() => {
        fetchAndProcessData(); // Then fetch contact data
    });

    // Determine initial tab to display based on URL 'tab' parameter or default to 'guest'
    if (mainTabFromUrl) {
        switchMainTab(mainTabFromUrl);
    } else {
        switchMainTab('home'); // Default to 'guests' tab
    }
};
