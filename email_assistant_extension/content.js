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
    dropdown.style.background = '#fff'; // changed from #1a73e8
    dropdown.style.border = '1px solid rgba(0,0,0,0.1)';
    dropdown.style.borderRadius = '4px';
    dropdown.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
    dropdown.style.display = 'none';
    dropdown.style.minWidth = 'auto';
    dropdown.style.width = 'fit-content';
    dropdown.style.padding = '4px 0';

    const tones = ['professional', 'friendly', 'casual'];

    tones.forEach(tone => {
        const option = document.createElement('div');
        option.textContent = tone.charAt(0).toUpperCase() + tone.slice(1);
        option.style.padding = '10px 16px';
        option.style.cursor = 'pointer';
        option.style.fontSize = '14px';
        option.style.color = '#202124'; // Gmail's dark text
        option.style.fontWeight = '400';

        option.addEventListener('mouseover', () => {
            option.style.background = '#f1f3f4'; // Gmail-like hover
        });

        option.addEventListener('mouseout', () => {
            option.style.background = 'transparent'; // reset on mouse out
        });



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
/////
function showSpamWarningBanner(message = "🚨 Spam alert! This message looks suspicious.") {
    // Avoid duplicate warnings
    const existing = document.querySelector('.ai_spam_banner');
    if (existing) return;

    const banner = document.createElement('div');
    banner.classList.add('ai_spam_banner');
    banner.textContent = message;

    // Basic style
    Object.assign(banner.style, {
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#ff4d4f',
        color: '#fff',
        padding: '12px 20px',
        fontSize: '14px',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        zIndex: 10000,
        animation: 'fadeInOut 4s ease-in-out forwards'
    });

    document.body.appendChild(banner);

    // Remove after animation
    setTimeout(() => {
        banner.remove();
    }, 6000);
}

// Add animation style
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeInOut {
    0% { opacity: 0; transform: translate(-50%, -20px); }
    10% { opacity: 1; transform: translate(-50%, 0); }
    90% { opacity: 1; transform: translate(-50%, 0); }
    100% { opacity: 0; transform: translate(-50%, -20px); }
}
`;
document.head.appendChild(style);


async function generateReplyWithTone(tone) {
    // const button = document.querySelector('.ai_selector_button > .T-I');
    const button = document.querySelector('.ai_selector_button > .ai_main_button');

    try {
        button.textContent = 'Generating...';
        button.style.pointerEvents = 'none';

        const emailContent = getEmailContent();
        const file = window.selectedAttachment;

        let response;

       
        const formData = new FormData();
formData.append('emailContent', emailContent);
formData.append('tone', tone);
if (file) {
  formData.append('file', file);
}

response = await fetch('http://localhost:8080/api/email/generate-with-file', {
  method: 'POST',
  body: formData
});


        if (!response.ok) throw new Error('API Request Failed');

        const generatedReply = await response.text();
        const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');

        // if (composeBox) {
        //     composeBox.focus();
        //     document.execCommand('insertText', false, generatedReply);
        // }
if (generatedReply.includes("We’ve stopped the reply to keep things safe and clean.")) {
    showSpamWarningBanner(); // Custom UI alert
} else if (composeBox) {
    composeBox.focus();
    document.execCommand('insertText', false, generatedReply);
}

         else {
            console.error('Compose box was not found');
        }
    } catch (error) {
        console.error(error);
        alert('Failed to generate reply');
    } finally {
        button.textContent = 'AI Reply ▼';
        button.style.pointerEvents = 'auto';
        window.selectedAttachment = null;
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


