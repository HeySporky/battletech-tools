const propertyID = 1;

export function callAnalytics(
    window: any,
    appSessionID: string = "",
    appVersion: string = "",
) {
    //Disabling Analytics for now
    return;
    /*
    try {
        if(!window) {
            return;
        }

        if(
            window.location.hostname === 'localhost' ||
            // [::1] is the IPv6 localhost address.
            window.location.hostname === '[::1]' ||
            // 127.0.0.1/8 is considered localhost for IPv4.
            window.location.hostname.match(
            /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
            )
        ) {
            // don't run analytics in a development url
            console.info("Analytics call ignored", appSessionID, appVersion)
            return;
        }

        let host: string = window.location.hostname;
        let url: string = window.location.pathname;

        if( typeof(fetch) !== "undefined" ) {
            fetch('https://analytics.jdgwf.com/analytics/', {
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                body: "property=" + propertyID.toString() + "&url=" + encodeURI(url) + "&host=" + encodeURI(host) + "&app_session_id=" + encodeURI(appSessionID) + "&app_version=" + encodeURI(appVersion),
            })
            .then(async (response) => {
                // response.json()
                // console.log( await response.text() )
            })
            .then((data) => {
            //   console.log('Success:', data);
            })
            .catch((error) => {
            //   console.error('Error:', error);
            });

        }
    }
    catch {

    }
    */
}