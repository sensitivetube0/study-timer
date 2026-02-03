const button = document.querySelector("#button")
const timerDisplay = document.querySelector("#timerDisplay")
chrome.runtime.sendMessage({ event: "subscribe" });


button.addEventListener("click",() =>{

    if(button.textContent === "Start Study Session"){
        button.textContent = "End Study Session"
    } else {
        button.textContent = "Start Study Session"
    }

    chrome.runtime.sendMessage({event: button.textContent === "Start Study Session" ? "onStop" : "onStart"})
})


// Listen for timer updates from background script
chrome.runtime.onMessage.addListener((data) => {

    switch(data.event) {
        case "timerUpdate":

            const elapsed = data.elapsed;
            button.textContent = data.running ? "End Study Session" : "Start Study Session";
            const hours = Math.floor(elapsed / 3600000).toString().padStart(2, '0');
            const minutes = Math.floor((elapsed % 3600000) / 60000).toString().padStart(2, '0');
            const seconds = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
            timerDisplay.innerText = `${hours}:${minutes}:${seconds}`;
            break;
    }

})
window.addEventListener("unload", () => {
  chrome.runtime.sendMessage({ event: "unsubscribe" });
});

window.addEventListener("beforeunload", () => {
  chrome.runtime.sendMessage({ event: "unsubscribe" });
});

window.addEventListener("pagehide", () => {
  chrome.runtime.sendMessage({ event: "unsubscribe" });
});