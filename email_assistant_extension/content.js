console.log("Email Asssistant extension - content file is loaded");
console.log("hello this is me.")

// function createAIButton() {
//     const button = document.createElement('div');
//     //button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';
//     button.classList.add('ai_selector_button');
//     button.style.marginRight = '8px';
//     button.innerHTML = 'AI Reply';
//     button.setAttribute('role', 'button');
//     button.setAttribute('data-tooltip', 'Generate AI Reply');
//     return button;
// }
function createAIButton() {
    const container = document.createElement('div');
    container.classList.add('ai_selector_button');
    container.style.marginRight = '8px';
    container.style.position = 'relative';
    container.style.display = 'flex';

    // Main button
    const mainButton = document.createElement('div');
    // mainButton.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';
    mainButton.classList.add('ai_main_button'); // add this line
    mainButton.textContent = 'AI Reply ▼';
    mainButton.setAttribute('role', 'button');
    mainButton.setAttribute('data-tooltip', 'Choose tone for AI reply');
    mainButton.style.cursor = 'pointer';

    // Dropdown
    const dropdown = document.createElement('div');
    dropdown.style.position = 'absolute';
    dropdown.style.top = '100%';
    dropdown.style.left = '0';
    dropdown.style.zIndex = '9999';
    dropdown.style.background = '#1a73e8';
    dropdown.style.border = '1px solid #ccc';
    dropdown.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    dropdown.style.display = 'none';
    dropdown.style.minWidth = '140px';

    const tones = ['professional', 'friendly', 'casual'];

    tones.forEach(tone => {
        const option = document.createElement('div');
        option.textContent = tone.charAt(0).toUpperCase() + tone.slice(1);
        option.style.padding = '8px 12px';
        option.style.cursor = 'pointer';
        option.style.color = '#fff';
        option.style.fontWeight = '500';
       option.addEventListener('mouseover', () => option.style.background = '#1558b0'); // darker on hover
option.addEventListener('mouseout', () => option.style.background = '#1a73e8'); // default Gmail blue


        option.addEventListener('click', () => {
            dropdown.style.display = 'none';
            generateReplyWithTone(tone);
        });
        dropdown.appendChild(option);
    });

    mainButton.addEventListener('click', () => {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    container.appendChild(mainButton);
    container.appendChild(dropdown);

    // Close dropdown if clicked outside
    document.addEventListener('click', function (event) {
        if (!container.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });

    return container;
}
// async function generateReplyWithTone(tone) {
//     const button = document.querySelector('.ai_selector_button > .T-I');
//     try {
//         button.textContent = 'Generating...';
//         button.style.pointerEvents = 'none';
//         const emailContent = getEmailContent();

//         const response = await fetch('http://localhost:8080/api/email/generate', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ emailContent, tone })
//         });

//         if (!response.ok) throw new Error('API Request Failed');

//         const generatedReply = await response.text();
//         const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');

//         if (composeBox) {
//             composeBox.focus();
//             document.execCommand('insertText', false, generatedReply);
//         } else {
//             console.error('Compose box was not found');
//         }

//     } catch (error) {
//         console.error(error);
//         alert('Failed to generate reply');
//     } finally {
//         button.textContent = 'AI Reply ▼';
//         button.style.pointerEvents = 'auto';
//     }
// }


/////
async function generateReplyWithTone(tone) {
    // const button = document.querySelector('.ai_selector_button > .T-I');
    const button = document.querySelector('.ai_selector_button > .ai_main_button');

    try {
        button.textContent = 'Generating...';
        button.style.pointerEvents = 'none';

        const emailContent = getEmailContent();
        const file = window.selectedAttachment;

        let response;

        if (file) {
            // Case 1: File is attached — use FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('emailContent', emailContent);
            formData.append('tone', tone);

            response = await fetch('http://localhost:8080/api/email/generate-with-file', {
                method: 'POST',
                body: formData
            });
        } else {
            // Case 2: No file — use JSON
            response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ emailContent, tone })
            });
        }

        if (!response.ok) throw new Error('API Request Failed');

        const generatedReply = await response.text();
        const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');

        if (composeBox) {
            composeBox.focus();
            document.execCommand('insertText', false, generatedReply);
        } else {
            console.error('Compose box was not found');
        }

    } catch (error) {
        console.error(error);
        alert('Failed to generate reply');
    } finally {
        button.textContent = 'AI Reply ▼';
        button.style.pointerEvents = 'auto';
    }
}


function getEmailContent() {
    const selectors = [
        '.h7',
        '.a3s.aiL',
        '.gmail_quote',
        '[role="presentation"]'
    ];
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) {
            return content.innerText.trim();
        }
        return '';
    }
}

function findComposeToolbar() {
    const selectors = [
        '.btC',
        '.aDh',
        '[role="toolbar"]',
        '.gU.Up'
    ];
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) return toolbar;
        return null;
    }
}
// function injectButton() {
//     //1. first just check whether there is an existing ai button . if it is there then i no need to create one more right. [if not checked then there may be multiple buttons of that ai reply.]
//     const existingButton = document.querySelector('.ai_selector_button');
//     if (existingButton) existingButton.remove(); // i prefer to remove it.

//     const toolbar = findComposeToolbar(); /// this function checks whether the tool is present or not.
//     if (!toolbar) {
//         console.log("Toolbar is not found");
//         return;
//     }
//     console.log("ToolBar found, creating AI button");
//     const button = createAIButton();
//     button.classList.add('ai_selector_button');
//     button.addEventListener('click', async () => {
//         try {
//             button.innerHTML = 'Generating...';
//             button.disabled = true;

//             const emailContent = getEmailContent();
//             console.log(emailContent);
//             const response = await fetch('http://localhost:8080/api/email/generate', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     emailContent: emailContent,
//                     tone: "professional"
//                 })
//             });

//             if (!response.ok) {
//                 throw new Error('API Request Failed');
//             }

//             const generatedReply = await response.text();
//             const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');

//             if (composeBox) {
//                 composeBox.focus();
//                 document.execCommand('insertText', false, generatedReply);
//             } else {
//                 console.error('Compose box was not found');
//             }
//         } catch (error) {
//             console.error(error);
//             alert('Failed to generate reply');
//         } finally {
//             button.innerHTML = 'AI Reply';
//             button.disabled = false;
//         }
//     });

//     toolbar.insertBefore(button, toolbar.firstChild);
// }

function injectButton() {
    const existingButton = document.querySelector('.ai_selector_button');
    if (existingButton) existingButton.remove();

    const toolbar = findComposeToolbar();
    if (!toolbar) return;

    const aiDropdown = createAIButton();
    // const uploadbutton = createUpLoadButton();
    toolbar.insertBefore(aiDropdown, toolbar.firstChild);
}

//////

// function createUploadButton() {
//     const container = document.createElement('div');
//     container.classList.add('ai_file_upload_button');
//     container.style.marginRight = '8px';

//     const label = document.createElement('label');
//     label.textContent = 'Attach File';
//     label.style.cursor = 'pointer';
//     label.style.background = '#1a73e8';
//     label.style.color = '#fff';
//     label.style.padding = '6px 12px';
//     label.style.borderRadius = '4px';
//     label.style.fontSize = '0.9rem';
//     label.style.fontWeight = '500';
//     label.style.userSelect = 'none';
//     label.style.display = 'inline-block';

//     const fileInput = document.createElement('input');
//     fileInput.type = 'file';
//     fileInput.accept = '.pdf,.docx,.pptx,.html,.txt';
//     fileInput.style.display = 'none';

//     fileInput.addEventListener('change', () => {
//         const file = fileInput.files[0];
//         if (file) {
//             console.log('Selected attachment:', file.name);
//             window.selectedAttachment = file; // Store globally for access during AI reply
//             label.textContent = 'File: ' + file.name;
//         }
//     });

//     label.appendChild(fileInput);
//     container.appendChild(label);
//     return container;
// }
function createUploadButton() {
    const container = document.createElement('div');
    container.classList.add('ai_file_upload_button');
    container.style.marginRight = '8px';

    const label = document.createElement('label');
    label.textContent = 'Attach File';
    label.classList.add('ai_main_button'); // Apply the shared style
    label.style.userSelect = 'none';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.docx,.pptx,.html,.txt';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            console.log('Selected attachment:', file.name);
            window.selectedAttachment = file;
            label.textContent = 'File: ' + file.name;
        }
    });

    label.appendChild(fileInput);
    container.appendChild(label);
    return container;
}



function injectFileUploadButton() {
    // Avoid adding multiple upload buttons
    const existingUpload = document.querySelector('.ai_file_upload_button');
    if (existingUpload) return;

    const toolbar = findComposeToolbar();
    if (!toolbar) return;

    const uploadButton = createUploadButton(); // We'll define this function if not yet
    toolbar.insertBefore(uploadButton, toolbar.firstChild);
}



const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('.nH Hd,.M9,[role = "dialog"]') || node.querySelector('.nH Hd,.M9,[role = "dialog"]'))
        );

        if (hasComposeElements) {
            console.log("Compose Window Detected");
            setTimeout(injectButton, 500);
        }
        // else {
        //     console.log("not loading there is a some isSec")
        // }
    }
});


observer.observe(document.body, {
    childList: true,
    subtree: true
});


// const observer1 = new MutationObserver((mutations) => {
//     for (const mutation of mutations) {
//         const addedNodes = Array.from(mutation.addedNodes);
//         const hasFileAttachment = addedNodes.some(node =>
//             node.nodeType === Node.ELEMENT_NODE &&
//             (
//                 node.matches('.aQa, .aQH, .dQ, .aoT, .aZo, .aQy, .aQe, [data-tooltip^="Attach"]') ||
//                 node.querySelector('.aQa, .aQH, .dQ, .aoT, .aZo, .aQy, .aQe, [data-tooltip^="Attach"]')
//             )
//         );

//         if (hasFileAttachment) {
//             console.log("File attachment detected in compose window");

//             // Optional: Inject your file upload button here
//             //injectFileUploadButton(); <-- you can implement this separately
//             setTimeout(injectFileUploadButton, 500);

//         }
//     }
// });

const observer1 = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);

        for (const node of addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;

            // Attachments added directly
            const hasAttachmentPreview =
                node.matches('.aQH') || node.querySelector?.('.aQH');

            // OR user has clicked "Attach" icon (just opened dialog, no file yet)
            const isAttachIconClicked =
                node.matches('[data-tooltip^="Attach"]') ||
                node.querySelector?.('[data-tooltip^="Attach"]');

            if (hasAttachmentPreview) {
                console.log("📎 Attachment preview detected (real file attached)");
                setTimeout(injectFileUploadButton, 500);
                return;
            } else if (isAttachIconClicked) {
                console.log("📎 Attach icon interaction (might not be file)");
                // Optional: delay injection to wait for file if needed
                setTimeout(() => {
                    const previewNow = document.querySelector('.aQH');
                    if (previewNow) {
                        injectFileUploadButton();
                    }
                }, 800); // Delay to wait for actual file preview
            }
        }
    }
});

observer1.observe(document.body, {
    childList: true,
    subtree: true
});


