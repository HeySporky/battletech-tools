
import React, { type JSX } from 'react';
import { FaBars } from "react-icons/fa";
import { Link } from 'react-router';
import { CONST_BATTLETECH_URL } from '../../configVars';
import { IAppGlobals } from '../app-router';
import BattleTechLogo from './battletech-logo';
import { microMechCreatorOffered } from './micro-mech-offer';
import { walkerCreatorOffered } from './walker-offer';
import './top-menu.scss';
const Bars = FaBars as any;

export default class TopMenu extends React.Component<ITopMenuProps, ITopMenuState> {

    constructor(props: ITopMenuProps) {
        super(props);
        this.state = {
            updated: false,
            openGroup: undefined,
        }

    }

    toggleMobile= (): void => {
        this.props.appGlobals.toggleMobile();
    }
    closeMobile= (): void => {
        this.props.appGlobals.closeMobile();
    }
    /** Opens a mobile menu group, closing the open one; tapping the open group closes it. */
    toggleGroup = (tag: string, open: boolean): void => {
        this.setState({ openGroup: open ? null : tag });
    }

    render = (): JSX.Element => {

    const menuStructure: IMenuDef[] = [
        {
            label: "Home",
            url: "/",
            tag: "home",
        },
    ];

    if( !this.props.appGlobals.appSettings.developerMenu ) {
        menuStructure.push({
            label: "Classic BattleTech",
            url: "/classic-battletech",
            tag: "classic-battletech-home",
            startsWithTag: "classic-battletech",
            subMenu: [
                {
                    label: "Home",
                    url: "/classic-battletech/",
                    tag: "classic-battletech-home",
                },
                {
                    label: "'Mech Creator",
                    url: "/classic-battletech/mech-creator",
                    tag: "classic-battletech-mech-creator",
                },
                {
                    label: "Vehicle Creator",
                    url: "/classic-battletech/vehicle-creator",
                    tag: "classic-battletech-vehicle-creator",
                },
                {
                    label: "Fighter Creator",
                    url: "/classic-battletech/fighter-creator",
                    tag: "classic-battletech-fighter-creator",
                },
                {
                    label: "Infantry Creator",
                    url: "/classic-battletech/infantry-creator",
                    tag: "classic-battletech-infantry-creator",
                },
                {
                    label: "Battle Armor Creator",
                    url: "/classic-battletech/battle-armor-creator",
                    tag: "classic-battletech-battle-armor-creator",
                },
                {
                    label: "ProtoMech Creator",
                    url: "/classic-battletech/protomech-creator",
                    tag: "classic-battletech-protomech-creator",
                },
                {
                    label: "Small Craft Creator",
                    url: "/classic-battletech/small-craft-creator",
                    tag: "classic-battletech-small-craft-creator",
                },
                {
                    label: "JumpShip and WarShip Creator",
                    url: "/classic-battletech/capital-ship-creator",
                    tag: "classic-battletech-capital-ship-creator",
                },
                {
                    label: "Building Creator",
                    url: "/classic-battletech/building-creator",
                    tag: "classic-battletech-building-creator",
                },
                {
                    label: "Roster",
                    url: "/classic-battletech/roster",
                    tag: "classic-battletech-roster",
                }
            ]
        });

        menuStructure.push({
            label: "Alpha Strike",
            url: "/alpha-strike",
            tag: "alpha-strike-home",
            startsWithTag: "alpha-strike",
            subMenu: [
                {
                    label: "Home",
                    url: "/alpha-strike/",
                    tag: "alpha-strike-home",
                },
                {
                    label: "Roster",
                    url: "/alpha-strike/roster",
                    tag: "alpha-strike-roster",
                },
                {
                    label: "Aces",
                    url: "/alpha-strike/aces",
                    tag: "alpha-strike-aces",
                }
            ]

        });
    } else {
        menuStructure.push({
            label: "Classic BattleTech",
            url: "/classic-battletech",
            tag: "classic-battletech-home",
            startsWithTag: "classic-battletech",
            subMenu: [
                {
                    label: "Home",
                    url: "/classic-battletech/",
                    tag: "classic-battletech-home",
                },
                {
                    label: "'Mech Creator",
                    url: "/classic-battletech/mech-creator",
                    tag: "classic-battletech-mech-creator",
                },
                {
                    label: "Vehicle Creator",
                    url: "/classic-battletech/vehicle-creator",
                    tag: "classic-battletech-vehicle-creator",
                },
                {
                    label: "Fighter Creator",
                    url: "/classic-battletech/fighter-creator",
                    tag: "classic-battletech-fighter-creator",
                },
                {
                    label: "Infantry Creator",
                    url: "/classic-battletech/infantry-creator",
                    tag: "classic-battletech-infantry-creator",
                },
                {
                    label: "Battle Armor Creator",
                    url: "/classic-battletech/battle-armor-creator",
                    tag: "classic-battletech-battle-armor-creator",
                },
                {
                    label: "ProtoMech Creator",
                    url: "/classic-battletech/protomech-creator",
                    tag: "classic-battletech-protomech-creator",
                },
                {
                    label: "Small Craft Creator",
                    url: "/classic-battletech/small-craft-creator",
                    tag: "classic-battletech-small-craft-creator",
                },
                {
                    label: "JumpShip and WarShip Creator",
                    url: "/classic-battletech/capital-ship-creator",
                    tag: "classic-battletech-capital-ship-creator",
                },
                {
                    label: "Building Creator",
                    url: "/classic-battletech/building-creator",
                    tag: "classic-battletech-building-creator",
                },
                {
                    label: "Roster",
                    url: "/classic-battletech/roster",
                    tag: "classic-battletech-roster",
                }
            ]
        });

        menuStructure.push({
            label: "Alpha Strike",
            url: "/alpha-strike/roster",
            tag: "alpha-strike-home",
            startsWithTag: "alpha-strike",
            subMenu: [
                {
                    label: "Home",
                    url: "/alpha-strike/",
                    tag: "alpha-strike-home",
                },
                {
                    label: "Roster",
                    url: "/alpha-strike/roster",
                    tag: "alpha-strike-roster",
                },
                {
                    label: "Aces",
                    url: "/alpha-strike/aces",
                    tag: "alpha-strike-aces",
                },
                // {
                //     label: "Unit Creator",
                //     url: "/alpha-strike/unit-creator",
                //     tag: "alpha-strike-unit-creator",
                // }
            ]

        });
    }

    menuStructure.push({
        label: "Game Management",
        url: "/game-management/match-play",
        tag: "game-management-home",
        startsWithTag: "game-management",
        subMenu: [
            {
                label: "Home",
                url: "/game-management/",
                tag: "game-management-home",
            },
            {
                label: "Alpha Strike Match Play Generator",
                url: "/game-management/match-play",
                tag: "game-management-match-play",
            }
        ]

    });

    menuStructure.push(
        {
            label: "TRO - JBT",
            url: "/classic-battletech/tro-jbt",
            tag: "tro-jbt",
        },
    );

    menuStructure.push(
        {
            label: "Other Tools",
            url: "/other-tools",
            tag: "other-tools",
        },
    );

    menuStructure.push(
        {
            label: "About",
            url: "/about",
            tag: "about",
        },
    );

    menuStructure.push({
        label: "Settings",
        url: "/settings",
        tag: "settings-home",
        startsWithTag: "settings",
        subMenu: [
            {
                label: "Settings",
                url: "/settings/",
                tag: "settings-home",
            },
            {
                label: "Backup and Restore",
                url: "/settings/backup-and-restore",
                tag: "settings-roster",
            }
        ]

    });

    if( this.props.appGlobals.appSettings.developerMenu ) {
        menuStructure.push(
            {
                label: "Equipment Editor",
                url: "/equipment-editor",
                tag: "equipment-editor",
            },
        );

        menuStructure.push(
            {
                label: "Custom MUL Editor",
                url: "/custom-mul-editor",
                tag: "custom-mul-editor",
            },
        );


    }

    // The Micro-Mech Creator is Custom Homebrew: its link follows the rules level (or a saved design), after ProtoMechs.
    if( microMechCreatorOffered(this.props.appGlobals) ) {
        for( const menu of menuStructure ) {
            const protoIndex = menu.subMenu?.findIndex( (item) => item.tag === "classic-battletech-protomech-creator" ) ?? -1;
            if( menu.subMenu && protoIndex > -1 ) {
                menu.subMenu.splice( protoIndex + 1, 0, {
                    label: "Micro-Mech Creator",
                    url: "/classic-battletech/micro-mech-creator",
                    tag: "classic-battletech-micro-mech-creator",
                });
            }
        }
    }

    // The Walker Creator is Custom Homebrew: its link follows the rules level (or a saved design), after the Micro-Mech Creator.
    if( walkerCreatorOffered(this.props.appGlobals) ) {
        for( const menu of menuStructure ) {
            const afterIndex = menu.subMenu?.findIndex( (item) => item.tag === "classic-battletech-micro-mech-creator" || item.tag === "classic-battletech-protomech-creator" ) ?? -1;
            if( menu.subMenu && afterIndex > -1 ) {
                const lastIndex = menu.subMenu.reduce( (found, item, index) => (item.tag === "classic-battletech-micro-mech-creator" || item.tag === "classic-battletech-protomech-creator") ? index : found, afterIndex );
                menu.subMenu.splice( lastIndex + 1, 0, {
                    label: "Walker Creator",
                    url: "/classic-battletech/walker-creator",
                    tag: "classic-battletech-walker-creator",
                });
            }
        }
    }

    let currentSubmenu: IMenuDef[] = [];
    for( const menu of menuStructure ) {
        if(
            menu &&
            menu.startsWithTag &&
            menu.subMenu &&
            menu.subMenu.length > 0 &&
            this.props.current?.startsWith(menu.startsWithTag)
        ) {
            currentSubmenu = menu.subMenu;
        }
    }
      return (
          <>
          <header className="topmenu">
            <nav aria-label="Main menu">
            <ul className="main-menu">
                <li className="mobile-menu-button d-inline d-md-none"><button type="button" className="mobile-menu-toggle" aria-label="Menu" onClick={this.toggleMobile}><Bars /></button></li>
                {menuStructure.map( (item, itemIndex) => {
                    return (
                        <React.Fragment key={itemIndex}>
                            {item.startsWithTag && item.subMenu && item.subMenu.length > 0 ? (
                                <>
                                    <li className="d-none d-md-inline"><Link className={this.props.current?.startsWith(item.startsWithTag) ? "current" : "" } to={`${process.env.PUBLIC_URL}${item.url}`}>{item.label}</Link></li>
                                </>
                            ) : (
                                <li className="d-none d-md-inline"><Link className={this.props.current === item.tag ? "current" : "" } to={`${process.env.PUBLIC_URL}${item.url}`}>{item.label}</Link></li>
                            )}

                        </React.Fragment>
                    )
                })}

                <li className="logo">
                    <a
                        href={CONST_BATTLETECH_URL}
                        rel="noopener noreferrer"
                        target="_blank"
                        title="Click here to go to the official BattleTech website!"
                    >
                        <BattleTechLogo
                            baseColor={this.props.appGlobals.appSettings.uiTheme === "desaturated" ? "#ddd" : ""}
                            altColor={this.props.appGlobals.appSettings.uiTheme === "desaturated" ? "#aaa" : ""}
                            // bottomAltColor='#2528d6'
                        />
                    </a>
                </li>
            </ul>
            </nav>
        {/* {subMenu} */}
        {currentSubmenu ? (
            <nav aria-label="Section menu">
            <ul className="sub-menu">
                {currentSubmenu.map( (item, itemIndex) => {
                    return (
                        <li key={itemIndex} className="d-none d-md-inline"><Link className={this.props.current === item.tag ? "current" : "" } to={`${process.env.PUBLIC_URL}${item.url}`}>{item.label}</Link></li>
                    )
                })}
            </ul>
            </nav>
        ) : null}

          </header>
            <nav className="mobile-menu" aria-label="Mobile menu">
                <ul className="main-menu">
                {menuStructure.map( (item, itemIndex) => {
                    return (
                        <React.Fragment key={itemIndex}>
                            {item.subMenu && item.subMenu.length > 0 && item.startsWithTag ? (() => {
                                // Until a group is tapped, the one holding the current page is open.
                                const groupTag = item.startsWithTag;
                                const open = this.state.openGroup === undefined
                                    ? !!this.props.current?.startsWith(groupTag)
                                    : this.state.openGroup === groupTag;
                                return (
                                <li>
                                <button
                                    type="button"
                                    className={`mobile-menu-group${open ? " open" : ""}`}
                                    aria-expanded={open}
                                    onClick={() => this.toggleGroup(groupTag, open)}
                                >{item.label}<span aria-hidden="true">{open ? "▾" : "▸"}</span></button>
                                {open ? (
                                <ul className="sub-menu">
                                    {item.subMenu.map( (subItem, subItemIndex) => {
                                        return (
                                            <li key={subItemIndex}><Link onClick={this.closeMobile} className={this.props.current === subItem.tag ? "current" : "" } to={`${process.env.PUBLIC_URL}${subItem.url}`}>{subItem.label}</Link></li>
                                        )
                                    })}

                                </ul>
                                ) : null}
                            </li>
                                );
                            })() : (
                                <li><Link onClick={this.closeMobile} className={this.props.current === item.tag ? "current" : "" } to={`${process.env.PUBLIC_URL}${item.url}`}>{item.label}</Link></li>
                            )}
                        </React.Fragment>
                    )
                })}

                </ul>

            </nav>
          </>
      );
    }
}

interface ITopMenuProps {
    current?: string;
    sub?: string;
    appGlobals: IAppGlobals;
}

interface ITopMenuState {
    updated: boolean;
    /** The open mobile menu group: undefined until one is tapped (the current page's group shows), null for none. */
    openGroup?: string | null;

}

interface IMenuDef {
    label: string;
    tag: string;
    url: string;
    startsWithTag?: string;
    subMenu?: IMenuDef[];
}
