/*
    The data here is/may be copyrighted and NOT included in the GPLv3 license.
    This data is blatantly and lovingly copied from the Solaris Skunk Werks project at https://github.com/Solaris-Skunk-Werks/SSW-Master
*/
// SSW designs outside the bundled set (sswMechs.ts), kept as import regression fixtures.
export const sswTestFixtures: Record<string, string> = {
    "Champion C": `<?xml version="1.0" encoding ="UTF-8"?>
<mech name="Champion" model="C" tons="60" omnimech="FALSE" solaris7id="0" solaris7imageid="0" sswimage="">
    <ssw_savefile_version>3</ssw_savefile_version>
    <battle_value>2191</battle_value>
    <cost>1.2598E7</cost>
    <rules_level>1</rules_level>
    <era>1</era>
    <productionera>2</productionera>
    <mech_type>BattleMech</mech_type>
    <techbase manufacturer="Unknown" location="Unknown">Clan</techbase>
    <year restricted="FALSE">2867</year>
    <motive_type>Biped</motive_type>
    <structure manufacturer="Unknown" techbase="2">
        <type>Standard Structure</type>
    </structure>
    <engine rating="300" manufacturer="Unknown" lsstart="0" rsstart="0" techbase="1">XL Engine</engine>
    <gyro techbase="2">Standard Gyro</gyro>
    <cockpit>
        <type ejectionseat="FALSE" commandconsole="FALSE" fhes="FALSE">Standard Cockpit</type>
    </cockpit>
    <armor manufacturer="Unknown" techbase="1">
        <type>Ferro-Fibrous</type>
        <hd>9</hd>
        <ct>28</ct>
        <ctr>9</ctr>
        <lt>20</lt>
        <ltr>7</ltr>
        <rt>20</rt>
        <rtr>7</rtr>
        <la>19</la>
        <ra>19</ra>
        <ll>27</ll>
        <rl>27</rl>
        <location index="3">LA</location>
        <location index="3">RA</location>
        <location index="4">LA</location>
        <location index="4">RA</location>
        <location index="7">LT</location>
        <location index="8">LT</location>
        <location index="9">RT</location>
    </armor>
    <baseloadout fcsa4="TRUE" fcsa5="FALSE" fcsapollo="FALSE">
        <source>RS3050Uu-C</source>
        <info>Champion C 60t, 5/8/5, XLFE, Std; 10.0T/96% FF Armor; 10 DHS; 2 SPL, 2 ERML, 1 SRM6, 2 MPL, 1 LB10</info>
        <battleforce pv="22" wt="3" mv="5j" s="4" m="4" l="1" e="0" ov="2" armor="6" internal="3" abilities="CASE, SRCH, ES, SEAL, SOA, FLK 1/1/1" />
        <actuators lla="FALSE" lh="FALSE" rla="FALSE" rh="FALSE"/>
        <clancase>TRUE</clancase>
        <jumpjets number="5">
            <type>Standard Jump Jet</type>
            <location index="4">LL</location>
            <location index="5">RL</location>
            <location index="4">RL</location>
            <location index="5">LL</location>
            <location index="10">CT</location>
        </jumpjets>
        <heatsinks number="10" techbase="1">
            <type>Double Heat Sink</type>

        </heatsinks>
        <equipment>
            <name manufacturer="">(CL) LB 10-X AC</name>
            <type>ballistic</type>
            <location index="2">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="">(CL) ER Medium Laser</name>
            <type>energy</type>
            <location index="2">RA</location>
        </equipment>
        <equipment>
            <name manufacturer="">(CL) ER Medium Laser</name>
            <type>energy</type>
            <location index="2">LA</location>
        </equipment>
        <equipment>
            <name manufacturer="">(CL) Small Pulse Laser</name>
            <type>energy</type>
            <location index="3">HD</location>
        </equipment>
        <equipment>
            <name manufacturer="">(CL) Small Pulse Laser</name>
            <type>energy</type>
            <location index="11">CT</location>
        </equipment>
        <equipment>
            <name manufacturer="">(CL) Medium Pulse Laser</name>
            <type>energy</type>
            <location index="4">LT</location>
        </equipment>
        <equipment>
            <name manufacturer="">(CL) Medium Pulse Laser</name>
            <type>energy</type>
            <location index="5">LT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(CL) @ LB 10-X AC (Slug)</name>
            <type>ammunition</type>
            <location index="7">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(CL) @ LB 10-X AC (Cluster)</name>
            <type>ammunition</type>
            <location index="8">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="">(CL) SRM-6</name>
            <type>missile</type>
            <location index="2">LT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">@ SRM-6 (Artemis IV Capable)</name>
            <type>ammunition</type>
            <location index="6">LT</location>
        </equipment>
    </baseloadout>
    <fluff>
        <overview></overview>
        <capabilities></capabilities>
        <battlehistory></battlehistory>
        <deployment></deployment>
        <variants></variants>
        <notables></notables>
        <additional></additional>
        <jumpjet_model>Unknown</jumpjet_model>
        <commsystem>Unknown</commsystem>
        <tandtsystem>Unknown</tandtsystem>
    </fluff>
</mech>
`,
};
