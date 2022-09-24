
(function() {
    'use strict';

    setInterval(function () {
        let scroller = document.getElementById('scroller')
        if (scroller != undefined) {
            let content = scroller.children[0]
            let items = content.children
            items.forEach(element => {
                let adElement = element.getElementsByClassName('wbpro-ad-tag')
                if (adElement.length != 0 && element.style.display != 'none') {
                    console.log(adElement)
                    element.style.display = 'none'
                }
            });
        }
    }, 1000);
}());