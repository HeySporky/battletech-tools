import React from 'react';

export default class BattleTechLogo extends React.Component<IBattleTechLogoProps, IBattleTechLogoState> {
    width = 210;
    height = 28;
    xLoc = 0;
    yLoc = 0;
    baseColor: string = "rgb(253,253,227)";
    altColor: string = "rgb(223,171,45)";

    constructor( props: IBattleTechLogoProps ) {
        super(props);

        var baseWidth = 210;
        var baseHeight = 28;
        if( typeof( this.props.width ) === "undefined" || this.props.width === 0) {
            this.width = 210;
            this.height = 28;
        } else {
            this.width = this.props.width;
            this.height = Math.round( this.props.width / baseWidth * baseHeight );
        }

        if( typeof( this.props.xLoc ) === "undefined" ) {
            this.xLoc = 0;
        } else {
            this.xLoc = this.props.xLoc;
        }

        if( typeof( this.props.yLoc ) === "undefined" ) {
            this.yLoc = 0;
        } else {
            this.yLoc = this.props.yLoc;
        }

        if( this.props.baseColor ) {
            this.baseColor = this.props.baseColor;
        }
        if( this.props.altColor ) {
            this.altColor = this.props.altColor;
        }
    }
    render() {
        return (
            <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlSpace="preserve"
                height={ this.height + "px"}
                width={ this.width + "px"}
                x={this.xLoc +  'px'}
                y={this.yLoc +  'px'}
                viewBox="0 0 790 100"
            >
                <g>
                    <path
                        style={{fill: this.baseColor, fillOpacity:1}}
                        d="m 613.14797,97.475074 c -22.55326,-4.54102 -37.15014,-23.093463 -35.59872,-45.245504 0.80541,-11.500123 4.65183,-20.129404 12.33332,-27.669285 8.70005,-8.53966 19.66012,-12.841085 32.94182,-12.928434 13.03574,-0.08571 22.06992,3.344107 29.95796,11.373609 4.30902,4.386291 9.64083,12.354358 8.81769,13.177502 -0.48955,0.489545 -18.75978,9.049511 -20.47631,9.59357 -1.28765,0.408111 -1.96543,-0.151872 -3.84663,-3.178085 -1.45635,-2.342783 -3.5741,-4.429788 -5.84618,-5.761307 -9.13401,-5.352899 -22.62013,-0.192407 -26.08697,9.982218 -1.87994,5.517331 -1.54632,13.334811 0.76721,17.977475 4.14483,8.317581 13.22817,12.313718 22.27788,9.800981 3.11377,-0.864571 10.18475,-7.253029 10.18475,-9.201671 0,-0.612272 0.31314,-1.306735 0.69586,-1.543272 0.55987,-0.346024 21.30969,8.637335 22.34734,9.674984 0.15811,0.158104 -0.66682,2.076919 -1.83316,4.264015 -2.70077,5.064342 -10.72234,13.110593 -15.73262,15.781022 -8.54657,4.555229 -20.29316,6.038485 -30.90324,3.902182 z M 1.432377,54.886471 l 0,-42.291291 26.734517,0.0117 c 28.953298,0.01266 32.397458,0.368487 38.567864,3.984585 13.631143,7.988382 13.737063,28.930366 0.181219,35.829155 -2.190529,1.114789 -2.191238,1.117415 -0.451992,1.669431 2.916553,0.92567 8.378881,6.520629 10.230164,10.478542 2.158699,4.615149 2.382168,12.500468 0.509976,17.995039 -1.645329,4.828763 -7.551683,10.785957 -12.587425,12.69577 -3.388228,1.284982 -6.476365,1.438839 -33.45854,1.667006 l -29.725783,0.251359 0,-42.291282 z m 48.096499,19.665707 c 0.898395,-0.472873 1.880668,-1.230047 2.182849,-1.682594 C 52.668353,71.4369 52.329337,68.475488 51.046407,67.057876 49.949844,65.846179 48.500843,65.6903 38.333494,65.6903 l -11.475292,0 0,4.860823 0,4.860823 10.518626,0 c 6.479807,0 11.145807,-0.330129 12.152048,-0.859768 z M 49.420837,42.018111 c 1.678338,-1.518873 1.768324,-4.237325 0.192417,-5.813223 -0.959715,-0.959724 -3.153138,-1.17515 -11.965096,-1.17515 l -10.789956,0 0,4.113006 0,4.112997 10.597539,0 c 8.81168,0 10.827988,-0.208552 11.965096,-1.23763 z m 127.001083,24.439995 0,-30.640563 -11.03033,-0.20695 -11.03032,-0.206942 0,-11.217279 0,-11.217279 35.14748,0 35.14747,0 0,11.217279 0,11.217279 -11.03032,0.206942 -11.03033,0.20695 0,30.640563 0,30.640572 -13.08682,0 -13.08683,0 z m 74.78186,-0.01994 0,-30.660561 -11.23676,0 -11.23675,0 0.20642,-11.404231 0.20644,-11.404241 35.14747,0 35.14748,0 0,11.217279 0,11.21728 -11.03033,0.206941 -11.03033,0.20696 0,30.640563 0,30.640572 -13.08682,0 -13.08682,0 z m 53.27584,-11.404231 0.19319,-42.064802 12.89987,-0.204611 12.89986,-0.204612 0,30.678221 0,30.678222 15.70419,0 15.70419,0 0,11.591182 0,11.591193 -28.79724,0 -28.79723,0 z m 63.70339,41.071024 c -0.20974,-0.54658 -0.28331,-19.475735 -0.16349,-42.064792 l 0.21787,-41.071034 68.61235,-0.190863 68.61235,-0.190873 0,11.595104 0,11.595104 -11.21728,0 -11.21728,0 0,30.660561 0,30.660562 -12.71291,0 -12.71292,0 0,-30.660562 0,-30.660561 -31.78229,0 -31.78228,0 0,3.739093 0,3.739093 18.69546,0 18.69546,0 0,11.217279 0,11.21728 -18.69546,0 -18.69546,0 0,4.112996 0,4.113007 19.06937,0 19.06937,0 0,11.591182 0,11.591193 -31.80576,0 c -25.76175,0 -31.87822,-0.18885 -32.1871,-0.993769 z m 142.51381,-41.257985 0,-42.251745 31.78229,0 31.78229,0 0,11.591183 0,11.591193 -18.69546,0 -18.69547,0 0,3.739093 0,3.739093 18.32155,0 18.32156,0 0,11.217279 0,11.21728 -18.32156,0 -18.32155,0 0,4.112996 0,4.113007 18.69547,0 18.69546,0 0,11.591182 0,11.591193 -31.78229,0 -31.78229,0 z m 154.97917,0.186961 0.19318,-42.064802 12.89988,-0.204611 12.89986,-0.204612 0,14.974032 0,14.974032 14.58246,0 14.58247,0 0,-14.974032 0,-14.974032 12.89986,0.204612 12.89988,0.204611 0,41.877841 0,41.877841 -12.89988,0.204611 -12.89986,0.204621 0,-16.095762 0,-16.095762 -14.58247,0 -14.58246,0 0,16.078103 0,16.078102 -13.09305,0 -13.09304,0 z"
                    />
                    <path
                        style={{fill: this.altColor, fillOpacity:1}}
                        d="m 81.354266,96.997204 c 0.132976,-0.52117 2.748565,-5.40069 5.812408,-10.84338 l 5.570619,-9.89577 26.257817,0 26.25782,0 5.74945,10.15953 c 3.16218,5.58774 5.74943,10.46725 5.74943,10.84337 0,0.40421 -15.46403,0.68383 -37.81966,0.68383 -30.157097,0 -37.770684,-0.19199 -37.577884,-0.94758 z m -1.627755,-27.03083 c 0,-1.33965 39.191139,-70.72527986 39.670909,-70.23501986 0.33538,0.34274 9.36944,16.27127986 20.07565,35.39672986 l 19.46585,34.77357 -13.19042,0.20474 c -7.25473,0.11262 -13.43513,-0.0556 -13.73422,-0.3739 -0.29911,-0.31827 -3.31884,-5.57872 -6.71055,-11.68991 -5.31432,-9.57538 -6.27985,-10.91917 -6.98514,-9.72164 -0.45011,0.76429 -3.34948,5.9326 -6.44302,11.48516 l -5.62462,10.09555 -13.262212,0.20421 c -7.294228,0.11231 -13.262227,0.0496 -13.262227,-0.13949 z"
                    />
                </g>
                <text
                    x="750"
                    y="30"
                    fontFamily="sans-serif"
                    textAnchor="start"
                    style={{fill: this.baseColor, fillOpacity:1}}
                    fontSize="25"
                >
                    TM
                </text>
            </svg>
        )
    }
}

interface IBattleTechLogoProps {
    xLoc?: number;
    yLoc?: number;
    width?: number;
    baseColor?: string;
    altColor?: string;
}

interface IBattleTechLogoState {
}