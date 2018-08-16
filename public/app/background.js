// Called when the user clicks on the browser action
chrome.browserAction.onClicked.addListener(function(tab) {
    // Send a message to the active tab
    console.log(tab)
    chrome.tabs.query({active: true, currentWindow:true},function(tabs) {
         var activeTab = tabs[0];
         console.log(activeTab)
         chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
    });
 });