console.log("Email Asssistant extension - content file is loaded");
console.log("hello this is me.")

function createAIButton() {
    const button = document.createElement('div');
    //button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';
    button.classList.add('ai_selector_button');
    button.style.marginRight = '8px';
    button.innerHTML = 'AI Reply';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI Reply');
    return button;
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
function injectButton() {
    //1. first just check whether there is an existing ai button . if it is there then i no need to create one more right. [if not checked then there may be multiple buttons of that ai reply.]
    const existingButton = document.querySelector('.ai_selector_button');
    if (existingButton) existingButton.remove(); // i prefer to remove it.

    const toolbar = findComposeToolbar(); /// this function checks whether the tool is present or not.
    if (!toolbar) {
        console.log("Toolbar is not found");
        return;
    }
    console.log("ToolBar found, creating AI button");
    const button = createAIButton();
    button.classList.add('ai_selector_button');
    button.addEventListener('click', async () => {
        try {
            button.innerHTML = 'Generating...';
            button.disabled = true;

            const emailContent = getEmailContent();
            console.log(emailContent);
            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailContent: emailContent,
                    tone: "professional"
                })
            });

            if (!response.ok) {
                throw new Error('API Request Failed');
            }

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
            button.innerHTML = 'AI Reply';
            button.disabled = false;
        }
    });

    toolbar.insertBefore(button, toolbar.firstChild);
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