/*
    The data here is/may be copyrighted and NOT included in the GPLv3 license.
    This data is blatantly and lovingly copied from the Solaris Skunk Werks project at https://github.com/Solaris-Skunk-Werks/SSW-Master
*/
// SSW designs kept as import regression fixtures, by name and model.
export const sswTestFixtures: Record<string, string> = {
    "Griffin GRF-1N": `<?xml version="1.0" encoding ="UTF-8"?>
<mech name="Griffin" model="GRF-1N" tons="55" omnimech="FALSE" solaris7id="0" solaris7imageid="0" sswimage="../Images/No_Image.png">
    <ssw_savefile_version>3</ssw_savefile_version>
    <battle_value>1272</battle_value>
    <cost>4924106.666666667</cost>
    <rules_level>0</rules_level>
    <era>0</era>
    <productionera>0</productionera>
    <mech_type>BattleMech</mech_type>
    <techbase manufacturer="Earthwerks Incorporated, Defiance Industries, Kallon Industries" location="Keystone (Earthwerks), Hesperus II (Defiance), Talon (Kallon)">Inner Sphere</techbase>
    <year restricted="FALSE">2492</year>
    <motive_type>Biped</motive_type>
    <structure manufacturer="Earthwerks GRF" techbase="2">
        <type>Standard Structure</type>
    </structure>
    <engine rating="275" manufacturer="CoreTek" lsstart="-1" rsstart="-1" techbase="2">Fusion Engine</engine>
    <gyro techbase="2">Standard Gyro</gyro>
    <cockpit>
        <type ejectionseat="FALSE" commandconsole="FALSE" fhes="FALSE">Standard Cockpit</type>
    </cockpit>
    <armor manufacturer="Starshield A" techbase="2">
        <type>Standard Armor</type>
        <hd>9</hd>
        <ct>20</ct>
        <ctr>7</ctr>
        <lt>20</lt>
        <ltr>6</ltr>
        <rt>20</rt>
        <rtr>6</rtr>
        <la>14</la>
        <ra>14</ra>
        <ll>18</ll>
        <rl>18</rl>
    </armor>
    <baseloadout fcsa4="FALSE" fcsa5="FALSE" fcsapollo="FALSE">
        <source>RS3039u</source>
        <info>Griffin GRF-1N 55t, 5/8/5, Std FE, Std; 9.5T/82% Armor; 12 SHS; 1 PPC, 1 LRM10</info>
        <battleforce pv="13" wt="2" mv="5j" s="1" m="2" l="2" e="0" ov="0" armor="5" internal="5" abilities="SRCH, ES, SEAL, SOA, IF 1" />
        <actuators lla="TRUE" lh="TRUE" rla="TRUE" rh="TRUE"/>
        <clancase>FALSE</clancase>
        <jumpjets number="5">
            <type>Standard Jump Jet</type>
            <location index="11">CT</location>
            <location index="0">LT</location>
            <location index="0">RT</location>
            <location index="1">RT</location>
            <location index="1">LT</location>
        </jumpjets>
        <heatsinks number="12" techbase="2">
            <type>Single Heat Sink</type>

            <location index="10">CT</location>
        </heatsinks>
        <equipment>
            <name manufacturer="Fusigon">(IS) PPC</name>
            <type>energy</type>
            <location index="4">RA</location>
        </equipment>
        <equipment>
            <name manufacturer="">(IS) LRM-10</name>
            <type>missile</type>
            <location index="2">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(IS) @ LRM-10</name>
            <type>ammunition</type>
            <location index="4">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(IS) @ LRM-10</name>
            <type>ammunition</type>
            <location index="5">RT</location>
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
        <jumpjet_model>Rawlings 55</jumpjet_model>
        <commsystem>Neil 6000</commsystem>
        <tandtsystem>Octagon Tartrac, System C</tandtsystem>
    </fluff>
</mech>
`,
    "Atlas AS7-D": `<?xml version="1.0" encoding ="UTF-8"?>
<mech name="Atlas" model="AS7-D" tons="100" omnimech="FALSE" solaris7id="0" solaris7imageid="0" sswimage="../Images/No_Image.png">
    <ssw_savefile_version>3</ssw_savefile_version>
    <battle_value>1897</battle_value>
    <cost>9519000.0</cost>
    <rules_level>0</rules_level>
    <era>0</era>
    <productionera>1</productionera>
    <mech_type>BattleMech</mech_type>
    <techbase manufacturer="Unknown" location="Unknown">Inner Sphere</techbase>
    <year restricted="FALSE">2755</year>
    <motive_type>Biped</motive_type>
    <structure manufacturer="Unknown" techbase="2">
        <type>Standard Structure</type>
    </structure>
    <engine rating="300" manufacturer="Unknown" lsstart="-1" rsstart="-1" techbase="2">Fusion Engine</engine>
    <gyro techbase="2">Standard Gyro</gyro>
    <cockpit>
        <type ejectionseat="FALSE" commandconsole="FALSE" fhes="FALSE">Standard Cockpit</type>
    </cockpit>
    <armor manufacturer="Unknown" techbase="2">
        <type>Standard Armor</type>
        <hd>9</hd>
        <ct>47</ct>
        <ctr>14</ctr>
        <lt>32</lt>
        <ltr>10</ltr>
        <rt>32</rt>
        <rtr>10</rtr>
        <la>34</la>
        <ra>34</ra>
        <ll>41</ll>
        <rl>41</rl>
    </armor>
    <baseloadout fcsa4="FALSE" fcsa5="FALSE" fcsapollo="FALSE">
        <source>RS3039u</source>
        <info>Atlas AS7-D 100t, 3/5/0, Std FE, Std; 19.0T/99% Armor; 20 SHS; 4 ML, 1 SRM6, 1 AC20, 1 LRM20</info>
        <battleforce pv="19" wt="4" mv="3" s="5" m="5" l="2" e="0" ov="0" armor="10" internal="8" abilities="SRCH, ES, SEAL, SOA, AC 2/2/0, LRM 1/1/1, IF 1" />
        <actuators lla="TRUE" lh="TRUE" rla="TRUE" rh="TRUE"/>
        <clancase>FALSE</clancase>
        <heatsinks number="20" techbase="2">
            <type>Single Heat Sink</type>

            <location index="5">RL</location>
            <location index="4">RL</location>
            <location index="4">LL</location>
            <location index="5">LL</location>
            <location index="4">LA</location>
            <location index="0">LT</location>
            <location index="3">HD</location>
            <location index="4">RA</location>
        </heatsinks>
        <equipment>
            <name manufacturer="">(IS) Autocannon/20</name>
            <type>ballistic</type>
            <location index="0">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="">(IS) Medium Laser</name>
            <type>energy</type>
            <location index="5">LA</location>
        </equipment>
        <equipment>
            <name manufacturer="">(IS) Medium Laser</name>
            <type>energy</type>
            <location index="5">RA</location>
        </equipment>
        <equipment>
            <name manufacturer="">(R) (IS) Medium Laser</name>
            <type>energy</type>
            <location index="10">CT</location>
        </equipment>
        <equipment>
            <name manufacturer="">(R) (IS) Medium Laser</name>
            <type>energy</type>
            <location index="11">CT</location>
        </equipment>
        <equipment>
            <name manufacturer="">(IS) LRM-20</name>
            <type>missile</type>
            <location index="1">LT</location>
        </equipment>
        <equipment>
            <name manufacturer="">(IS) SRM-6</name>
            <type>missile</type>
            <location index="6">LT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">@ SRM-6</name>
            <type>ammunition</type>
            <location index="10">LT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(IS) @ LRM-20</name>
            <type>ammunition</type>
            <location index="8">LT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(IS) @ LRM-20</name>
            <type>ammunition</type>
            <location index="9">LT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(IS) @ AC/20</name>
            <type>ammunition</type>
            <location index="10">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(IS) @ AC/20</name>
            <type>ammunition</type>
            <location index="11">RT</location>
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
        <jumpjet_model>None</jumpjet_model>
        <commsystem>Unknown</commsystem>
        <tandtsystem>Unknown</tandtsystem>
    </fluff>
</mech>
`,
    "Commando COM-7B": `<?xml version="1.0" encoding ="UTF-8"?>
<mech name="Commando" model="COM-7B" tons="25" omnimech="FALSE" solaris7id="0" solaris7imageid="0" sswimage="../Images/No_Image.png">
    <ssw_savefile_version>3</ssw_savefile_version>
    <battle_value>602</battle_value>
    <cost>2769500.0</cost>
    <rules_level>1</rules_level>
    <era>2</era>
    <productionera>6</productionera>
    <mech_type>BattleMech</mech_type>
    <techbase manufacturer="Unknown" location="Unknown">Inner Sphere</techbase>
    <year restricted="FALSE">3068</year>
    <motive_type>Biped</motive_type>
    <structure manufacturer="Unknown" techbase="0">
        <type>Endo-Steel</type>
        <location index="4">HD</location>
        <location index="4">RA</location>
        <location index="5">HD</location>
        <location index="5">RA</location>
        <location index="6">RA</location>
        <location index="7">RT</location>
        <location index="7">LA</location>
        <location index="8">RT</location>
        <location index="8">LA</location>
        <location index="9">RT</location>
        <location index="9">LA</location>
        <location index="10">RT</location>
        <location index="10">LA</location>
        <location index="11">LT</location>
    </structure>
    <engine rating="150" manufacturer="Unknown" lsstart="0" rsstart="0" techbase="0">Light Fusion Engine</engine>
    <gyro techbase="2">Standard Gyro</gyro>
    <cockpit>
        <type ejectionseat="FALSE" commandconsole="FALSE" fhes="FALSE">Small Cockpit</type>
    </cockpit>
    <armor manufacturer="Unknown" techbase="2">
        <type>Standard Armor</type>
        <hd>9</hd>
        <ct>8</ct>
        <ctr>3</ctr>
        <lt>8</lt>
        <ltr>2</ltr>
        <rt>8</rt>
        <rtr>2</rtr>
        <la>6</la>
        <ra>6</ra>
        <ll>10</ll>
        <rl>10</rl>
    </armor>
    <baseloadout fcsa4="FALSE" fcsa5="FALSE" fcsapollo="FALSE">
        <source>RS3050Uu-I</source>
        <info>Commando COM-7B 25t, 6/9/4, LFE, ES; 4.5T/81% Armor; 10 DHS; 2 Flmr, 1 ERML, 2 SRM4</info>
        <battleforce pv="6" wt="1" mv="6/3j" s="3" m="2" l="0" e="0" ov="0" armor="2" internal="1" abilities="CASE, SRCH, ES, SEAL, SOA, SRM 1/1/0" />
        <actuators lla="TRUE" lh="TRUE" rla="TRUE" rh="TRUE"/>
        <clancase>FALSE</clancase>
        <jumpjets number="4">
            <type>Standard Jump Jet</type>
            <location index="4">LL</location>
            <location index="5">LL</location>
            <location index="4">RL</location>
            <location index="5">RL</location>
        </jumpjets>
        <heatsinks number="10" techbase="0">
            <type>Double Heat Sink</type>

            <location index="5">LT</location>
            <location index="8">LT</location>
            <location index="2">RT</location>
            <location index="2">LT</location>
        </heatsinks>
        <equipment>
            <name manufacturer="">(IS) Flamer</name>
            <type>energy</type>
            <location index="5">LA</location>
        </equipment>
        <equipment>
            <name manufacturer="">(IS) Flamer</name>
            <type>energy</type>
            <location index="6">LA</location>
        </equipment>
        <equipment>
            <name manufacturer="">(IS) ER Medium Laser</name>
            <type>energy</type>
            <location index="4">LA</location>
        </equipment>
        <equipment>
            <name manufacturer="">(IS) SRM-4</name>
            <type>missile</type>
            <location index="10">CT</location>
        </equipment>
        <equipment>
            <name manufacturer="">(IS) SRM-4</name>
            <type>missile</type>
            <location index="11">CT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">@ SRM-4</name>
            <type>ammunition</type>
            <location index="5">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="">CASE</name>
            <type>CASE</type>
            <location index="6">RT</location>
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
    "Commando COM-5S": `<?xml version="1.0" encoding ="UTF-8"?>
<mech name="Commando" model="COM-5S" tons="25" omnimech="FALSE" solaris7id="0" solaris7imageid="0" sswimage="../Images/No_Image.png">
    <ssw_savefile_version>3</ssw_savefile_version>
    <battle_value>557</battle_value>
    <cost>2179500.0</cost>
    <rules_level>1</rules_level>
    <era>1</era>
    <productionera>4</productionera>
    <mech_type>BattleMech</mech_type>
    <techbase manufacturer="Unknown" location="Unknown">Inner Sphere</techbase>
    <year restricted="TRUE">3050</year>
    <motive_type>Biped</motive_type>
    <structure manufacturer="Unknown" techbase="0">
        <type>Endo-Steel</type>
        <location index="3">LT</location>
        <location index="4">LT</location>
        <location index="4">RT</location>
        <location index="5">LT</location>
        <location index="5">RT</location>
        <location index="6">LT</location>
        <location index="6">RT</location>
        <location index="7">LT</location>
        <location index="7">RT</location>
        <location index="8">LT</location>
        <location index="8">RT</location>
        <location index="9">LT</location>
        <location index="9">RT</location>
        <location index="10">RT</location>
    </structure>
    <engine rating="150" manufacturer="Unknown" lsstart="-1" rsstart="-1" techbase="2">Fusion Engine</engine>
    <gyro techbase="2">Standard Gyro</gyro>
    <cockpit>
        <type ejectionseat="FALSE" commandconsole="FALSE" fhes="FALSE">Standard Cockpit</type>
    </cockpit>
    <armor manufacturer="Unknown" techbase="0">
        <type>Ferro-Fibrous</type>
        <hd>5</hd>
        <ct>8</ct>
        <ctr>2</ctr>
        <lt>6</lt>
        <ltr>2</ltr>
        <rt>6</rt>
        <rtr>2</rtr>
        <la>5</la>
        <ra>5</ra>
        <ll>6</ll>
        <rl>6</rl>
        <location index="5">LA</location>
        <location index="5">RA</location>
        <location index="6">LA</location>
        <location index="6">RA</location>
        <location index="7">LA</location>
        <location index="7">RA</location>
        <location index="8">LA</location>
        <location index="8">RA</location>
        <location index="9">LA</location>
        <location index="9">RA</location>
        <location index="10">LA</location>
        <location index="10">RA</location>
        <location index="11">LA</location>
        <location index="11">RA</location>
    </armor>
    <baseloadout fcsa4="TRUE" fcsa5="FALSE" fcsapollo="FALSE">
        <source>RS3050Uu-I</source>
        <info>Commando COM-5S 25t, 6/9/0, Std FE, ES; 3.0T/60% FF Armor; 10 SHS; 1 ML, 1 SSRM2, 1 SRM6</info>
        <battleforce pv="6" wt="1" mv="6" s="2" m="2" l="0" e="0" ov="0" armor="2" internal="2" abilities="CASE, SRCH, ES, SEAL, SOA" />
        <actuators lla="TRUE" lh="TRUE" rla="TRUE" rh="TRUE"/>
        <clancase>FALSE</clancase>
        <heatsinks number="10" techbase="2">
            <type>Single Heat Sink</type>

            <location index="4">LL</location>
            <location index="5">LL</location>
            <location index="4">RL</location>
            <location index="5">RL</location>
        </heatsinks>
        <equipment>
            <name manufacturer="">(IS) SRM-6</name>
            <type>missile</type>
            <location index="0">LT</location>
        </equipment>
        <equipment>
            <name manufacturer="">(IS) Medium Laser</name>
            <type>energy</type>
            <location index="4">LA</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">@ SRM-6 (Artemis IV Capable)</name>
            <type>ammunition</type>
            <location index="1">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">@ SRM-6 (Artemis IV Capable)</name>
            <type>ammunition</type>
            <location index="0">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="">(IS) Streak SRM-2</name>
            <type>missile</type>
            <location index="4">RA</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(IS) @ Streak SRM-2</name>
            <type>ammunition</type>
            <location index="2">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="">CASE</name>
            <type>CASE</type>
            <location index="3">RT</location>
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
        <jumpjet_model>None</jumpjet_model>
        <commsystem>Unknown</commsystem>
        <tandtsystem>Unknown</tandtsystem>
    </fluff>
</mech>
`,
    "Shogun C": `<?xml version="1.0" encoding ="UTF-8"?>
<mech name="Shogun" model="C" tons="85" omnimech="FALSE" solaris7id="0" solaris7imageid="0" sswimage="../Images/No_Image.png">
    <ssw_savefile_version>3</ssw_savefile_version>
    <battle_value>3032</battle_value>
    <cost>9844050.0</cost>
    <rules_level>1</rules_level>
    <era>1</era>
    <productionera>2</productionera>
    <mech_type>BattleMech</mech_type>
    <techbase manufacturer="Unknown" location="Unknown">Clan</techbase>
    <year restricted="FALSE">2850</year>
    <motive_type>Biped</motive_type>
    <structure manufacturer="Unknown" techbase="2">
        <type>Standard Structure</type>
    </structure>
    <engine rating="255" manufacturer="Unknown" lsstart="-1" rsstart="-1" techbase="2">Fusion Engine</engine>
    <gyro techbase="2">Standard Gyro</gyro>
    <cockpit>
        <type ejectionseat="FALSE" commandconsole="FALSE" fhes="FALSE">Standard Cockpit</type>
    </cockpit>
    <armor manufacturer="Unknown" techbase="1">
        <type>Ferro-Fibrous</type>
        <hd>9</hd>
        <ct>40</ct>
        <ctr>11</ctr>
        <lt>27</lt>
        <ltr>9</ltr>
        <rt>27</rt>
        <rtr>9</rtr>
        <la>27</la>
        <ra>27</ra>
        <ll>27</ll>
        <rl>27</rl>
        <location index="5">LL</location>
        <location index="5">RL</location>
        <location index="9">LT</location>
        <location index="10">LT</location>
        <location index="11">CT</location>
        <location index="11">LT</location>
        <location index="11">RT</location>
    </armor>
    <baseloadout fcsa4="TRUE" fcsa5="FALSE" fcsapollo="FALSE">
        <source>RS3050Uu-I</source>
        <info>Shogun C 85t, 3/5/3, Std FE, Std; 12.5T/91% FF Armor; 16 DHS; 1 ERPPC, 2 LRM20, 4 SSRM6</info>
        <battleforce pv="30" wt="4" mv="3j" s="7" m="7" l="4" e="0" ov="2" armor="8" internal="7" abilities="CASE, SRCH, ES, SEAL, SOA, IF 3" />
        <actuators lla="TRUE" lh="FALSE" rla="TRUE" rh="FALSE"/>
        <clancase>TRUE</clancase>
        <jumpjets number="3">
            <type>Standard Jump Jet</type>
            <location index="10">CT</location>
            <location index="4">RL</location>
            <location index="4">LL</location>
        </jumpjets>
        <heatsinks number="16" techbase="1">
            <type>Double Heat Sink</type>

            <location index="5">LA</location>
            <location index="3">LA</location>
            <location index="0">LT</location>
            <location index="3">RA</location>
            <location index="5">RA</location>
            <location index="0">RT</location>
        </heatsinks>
        <equipment>
            <name manufacturer="">(CL) LRM-20</name>
            <type>missile</type>
            <location index="7">RA</location>
        </equipment>
        <equipment>
            <name manufacturer="">(CL) LRM-20</name>
            <type>missile</type>
            <location index="7">LA</location>
        </equipment>
        <equipment>
            <name manufacturer="">(CL) Streak SRM-6</name>
            <type>missile</type>
            <location index="2">LT</location>
        </equipment>
        <equipment>
            <name manufacturer="">(CL) Streak SRM-6</name>
            <type>missile</type>
            <location index="6">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="">(CL) Streak SRM-6</name>
            <type>missile</type>
            <location index="4">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="">(CL) Streak SRM-6</name>
            <type>missile</type>
            <location index="4">LT</location>
        </equipment>
        <equipment>
            <name manufacturer="">(CL) ER PPC</name>
            <type>energy</type>
            <location index="2">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(CL) @ Streak SRM-6</name>
            <type>ammunition</type>
            <location index="8">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(CL) @ Streak SRM-6</name>
            <type>ammunition</type>
            <location index="6">LT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(CL) @ LRM-20 (Artemis IV Capable)</name>
            <type>ammunition</type>
            <location index="7">LT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(CL) @ LRM-20 (Artemis IV Capable)</name>
            <type>ammunition</type>
            <location index="9">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(CL) @ LRM-20 (Artemis IV Capable)</name>
            <type>ammunition</type>
            <location index="8">LT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(CL) @ LRM-20 (Artemis IV Capable)</name>
            <type>ammunition</type>
            <location index="10">RT</location>
        </equipment>
    </baseloadout>
    <fluff>
        <overview></overview>
        <capabilities></capabilities>
        <battlehistory></battlehistory>
        <deployment></deployment>
        <variants></variants>
        <notables></notables>
        <additional>&lt;p style=&quot;margin-top: 0&quot;&gt;:br::br:&lt;/p&gt;:br:</additional>
        <jumpjet_model>Unknown</jumpjet_model>
        <commsystem>Unknown</commsystem>
        <tandtsystem>Unknown</tandtsystem>
    </fluff>
</mech>
`,
    "Archer ARC-2R": `<?xml version="1.0" encoding ="UTF-8"?>
<mech name="Archer" model="ARC-2R" tons="70" omnimech="FALSE" solaris7id="0" solaris7imageid="0" sswimage="../Images/No_Image.png">
    <ssw_savefile_version>3</ssw_savefile_version>
    <battle_value>1477</battle_value>
    <cost>6300973.333333335</cost>
    <rules_level>0</rules_level>
    <era>0</era>
    <productionera>0</productionera>
    <mech_type>BattleMech</mech_type>
    <techbase manufacturer="Earthwerks Incorporated, Vandenberg Mechanized Industries, Gorton, Kingsley &amp; Thorpe Enterprises (GKT)" location="Calloway VI (Earthwerks), New Vandenberg (VMI), Satalice (GKT)">Inner Sphere</techbase>
    <year restricted="FALSE">2474</year>
    <motive_type>Biped</motive_type>
    <structure manufacturer="Earthwerks Archer" techbase="2">
        <type>Standard Structure</type>
    </structure>
    <engine rating="280" manufacturer="VOX" lsstart="-1" rsstart="-1" techbase="2">Fusion Engine</engine>
    <gyro techbase="2">Standard Gyro</gyro>
    <cockpit>
        <type ejectionseat="FALSE" commandconsole="FALSE" fhes="FALSE">Standard Cockpit</type>
    </cockpit>
    <armor manufacturer="Maximillian 100" techbase="2">
        <type>Standard Armor</type>
        <hd>9</hd>
        <ct>33</ct>
        <ctr>10</ctr>
        <lt>24</lt>
        <ltr>6</ltr>
        <rt>24</rt>
        <rtr>6</rtr>
        <la>22</la>
        <ra>22</ra>
        <ll>26</ll>
        <rl>26</rl>
    </armor>
    <baseloadout fcsa4="FALSE" fcsa5="FALSE" fcsapollo="FALSE">
        <source>RS3039u</source>
        <info>Archer ARC-2R 70t, 4/6/0, Std FE, Std; 13.0T/96% Armor; 10 SHS; 4 ML, 2 LRM20</info>
        <battleforce pv="15" wt="3" mv="4" s="2" m="3" l="2" e="0" ov="0" armor="7" internal="6" abilities="SRCH, ES, SEAL, SOA, LRM 1/2/2, IF 2" />
        <actuators lla="TRUE" lh="TRUE" rla="TRUE" rh="TRUE"/>
        <clancase>FALSE</clancase>
        <heatsinks number="10" techbase="2">
            <type>Single Heat Sink</type>

        </heatsinks>
        <equipment>
            <name manufacturer="Diverse Optics Type 18">(IS) Medium Laser</name>
            <type>energy</type>
            <location index="4">RA</location>
        </equipment>
        <equipment>
            <name manufacturer="Diverse Optics Type 18">(IS) Medium Laser</name>
            <type>energy</type>
            <location index="4">LA</location>
        </equipment>
        <equipment>
            <name manufacturer="Diverse Optics Type 18">(R) (IS) Medium Laser</name>
            <type>energy</type>
            <location index="10">CT</location>
        </equipment>
        <equipment>
            <name manufacturer="Diverse Optics Type 18">(R) (IS) Medium Laser</name>
            <type>energy</type>
            <location index="11">CT</location>
        </equipment>
        <equipment>
            <name manufacturer="Doombud Long Range Missile 20 Racks">(IS) LRM-20</name>
            <type>missile</type>
            <location index="0">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="Doombud Long Range Missile 20 Racks">(IS) LRM-20</name>
            <type>missile</type>
            <location index="0">LT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(IS) @ LRM-20</name>
            <type>ammunition</type>
            <location index="6">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(IS) @ LRM-20</name>
            <type>ammunition</type>
            <location index="5">RT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(IS) @ LRM-20</name>
            <type>ammunition</type>
            <location index="5">LT</location>
        </equipment>
        <equipment>
            <name manufacturer="Unknown">(IS) @ LRM-20</name>
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
        <jumpjet_model>None</jumpjet_model>
        <commsystem>Neil 9000</commsystem>
        <tandtsystem>RCA Instatrac Mark XII</tandtsystem>
    </fluff>
</mech>
`,
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
