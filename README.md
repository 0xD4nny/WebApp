<h1>Web App Übungsaufgabe</h1>

<h3><u>Einleitung</u></h3>
<p>Im Rahmen meiner Ausbildung zum Fachinformatiker für Anwendungsentwicklung, habe ich die Aufgabe erhalten, eine Webseite zu entwickeln, die unsere API (SCTX) nutzt. <br>
Diese Übungsaufgabe dient dazu, mein Wissen und meine Fähigkeiten im Umgang mit Webtechnologien zu vertiefen.</p>

<h3><u>Projektbeschreibung</u></h3>
<p>Die Web-Anwendung soll, Daten der API (SCTX) abzurufen und anzuzeigen. Die Anwendung zeigt Systemdaten und Stream-Vorschauen für die am System angeschlossenen Monitore an. <br> 
Nutzer können durch die Anwendung navigieren, um einen Stream auszuwählen und diesen im Vollbildmodus anzusehen. 
Zusätzlich wird die Anwendung in der Lage sein, verschiedene Fehlerzustände zu verarbeiten und entsprechend anzuzeigen.</p>

<h3><u>Technologien</u></h3>
<ul>
<li><b>SCTX</b> ist eine integrierte Web-Anwendung, die Daten über das FastCGI-Protokoll bereitstellt. 
Die API sendet verschiedene Events mit Parametern, die von unserer Anwendung verarbeitet werden müssen.</li>
<li><b>Html, Css, Java-Script</b>, ohne zusätzliche Frameworks oder Bibliotheken.</li>
<li><b>Nginx</b> (Webserver)</li>
</ul>

<h3><u>Aufgabenstellung</u></h3>
<ul>
<li>Wenn die Webseite unter 127.0.0.1 aufgerufen wird, soll eine Übersichts-Seite erscheinen, welche Systemdaten und eine kleine Stream-Vorschau für jeden Monitor sauber darstellt.</li>
<li>Mann soll durch die Übersichts-Seite einen Stream wählen können und dann automatisch in den Fullscreen wechseln, in dem dann der Stream angezeigt wird.</li>
<li>System-Daten wie RAM kommen in Bytes von der API und müssen entsprechend auf eine sinnvolle Einheit umgerechnet werden, der entsprechende Postfix soll hinzugefügt werden.</li>
<li>Sollte die API einen 410 Error zurückgeben, muss die Übersichtsseite gelöscht und der Fehler entsprechend anzeigezeigt werden.</li>
</ul>

<h3><u>API-Aufrufe</u></h3>
<p>Wir haben mehre Möglichkeiten, Daten von der API abzufragen.</p>

```javascript
//Liefert einen Session-Key und alles was api/overview.sctx liefert.
fetch('/api/init.sctx');
```
```javascript
// Liefert Systemdaten wie, Memory, Processor, Display, etc. und ein Array mit Stream-Preview Images für jeden angeschlossenen Monitor des Systems.
fetch('/api/overview.sctx', { method: 'POST', body: `session=${session}` });
```
```javascript
//Wählt einen Stream aus und gibt einen Status zurück.
fetch('/api/select.sctx', { method: 'POST', body: `session=${session}&stream=${(streamNumber)}`});
```
```javascript
//Sendet verschiedene Events, mit Parametern, die von uns bedient werden müssen.
fetch('/api/event.sctx', { method: 'POST', body: `session=${session}` });
```

<h3><u>Events</u></h3>
<ul>
<li><b>geometry:</b> Der Stream hat die Geometrie geändert. Möglicherweise hat sich die Auflösung oder sogar das Seitenverhältnis des Streams geändert. Die Folge ist, dass die Stream-Ansicht dahingehend angepasst werden muss. Das vom Stream gezeigte Bild ist komplett schwarz nach diesem Befehl und das Overlay-Bild ist gelöscht und deaktiviert.</li>
<li><b>image:</b> Ein Ausschnitt oder das komplette Bild des Streams hat sich verändert. Es wird ein Link zu einem PNG-Bild übermittelt, incl. X- und Y-Koordinaten und Höhe und Weite.
Dieses Bild muss heruntergeladen und an der entsprechenden Stelle eingezeichnet werden.</li>
<li><b>overlay:</b> Das Overlay-Bild wird sichtbar oder unsichtbar geschaltet.</li>
<li><b>overlayImage:</b> Das Overlay-Bild wird upgedated. Das Overlay-Bild ist ein 68x68px JPEG und muss immer über das Bild des Streams geblendet werden und darf somit nicht überzeichnet werden.</li>
<li><b>overlayPosition:</b> Richtet die Overlay-Position ein. An den übermittelten Koordinaten muss sich nach dem Aufruf die Koordinate X=32/Y=32 des Overlay-Bildes befinden. Mit diesem Aufruf muss das Overlay-Bild also verschoben werden. Ist das Overlay-Bild unsichtbar, so muss es, nachdem es sichtbar geschaltet wird trotzdem an der zuletzt übermittelten Stelle angezeigt werden.</li>
<li><b>terminated:</b> Der Stream wurde beendet. Das muss entsprechend angezeigt werden und der Event-Handler sollte nicht mehr benutzt werden.</li>
<li>event kann mehrere Events auf einmal übermitteln. Links, die event zur Verfügung stellt sind mindestens 5 Sekunden lang' gültig und resultieren danach in einem 404-Fehler. Hier gibt es zu jedem Befehl entsprechende Parameter oder ein Bilder die wir weiterverarbeiten können.</li>
</ul>

<h3><u>Implementierung der Übersicht</u></h3>
![ProjectImg](https://github.com/user-attachments/assets/f0cf11ae-f3eb-4e6b-91af-1cd98fe8a2c3)

<p><br>Wie im Beispielbild zu erkennen ist, habe ich mich für eine Kachel-Ansicht entschieden.<br>
Statische Kachel: Stellt die Systemdaten dar. Diese wird einmalig erstellt.<br>
Dynamische Kachel: Für jeden Monitor wird eine dynamische Kachel erstellt, die alle 5 Sekunden per Intervall aktualisiert wird.<br>
Die statische Kachel zeigt Systemdaten in einem HTML-Table, der aus der JSON-Antwort der API generiert wird. Sie hat einen Toggle-Button, der die Kachel ein- und ausklappen kann.<br>
Die dynamischen Kacheln enthalten eine Vorschau des Streams und haben ein Klick-Event, das den Fullscreen-Modus aktiviert und den Stream startet.</p>

<h3><u>Implementierung des Streams</u></h3>
<p>Beim Klick auf eine dynamische Kachel, wird die Übersicht ausgeblendet und der Vollbildmodus aktiviert. <br>
Zur Anzeige des Streams nutzen wir 3 Canvas-Elemente.</p>
<ul>
<li>Overlay-Canvas: Zeigt den Mauszeiger an, damit dieser immer oben liegt und flüssiger läuft, haben wir hier ein eigenes Canvas, nur dafür.</li>
<li>Buffer-Canvas: Damit wir nicht jedes 80x80px Image einzeln auf die Webseite gezeichnet werden muss, schreiben wir alle Image-Fragmente eines Responses in einen Buffer.</li>
<li>Stream-Canvas: Nachdem wir das Array des Responses im Buffer-Canvas sind, übertragen wir den gesamten Buffer in das Stream-Canvas.</li>
</ul>
<p>So können wir die gesamten Response (5-15 Image-Fragmente) mit nur einem Zeichenbefehl zeichnen.</p>

<h3><u>Besondere Herausforderungen</u></h3>
<p>Eine besondere Herausforderung stellte die JSON-Struktur der API dar. Es gab keine einfache Hierarchie, sondern eine Mischung aus Objekten, Wrapper-Objekten und Top-Level-Key-Value-Pairs. <br>
Um dieses Problem zu lösen, entwickelte ich zwei Hilfsmethoden: Die erste erkennt Wrapper-Objekte und sammelt alle enthaltenen Objekte in einem Array, die zweite sammelt alle Top-Level-KVPs. <br>
Dadurch konnte ich jede JSON (ohne Arrays) generisch in die statische Kachel einlesen und darstellen.</p>

<h3><u>Fehlerbehandlung</u></h3>
<p>Sollte es beim Fetch zu einem Fehler kommen, wird eine spezielle Fehlerseite angezeigt, <br>
die den Fehlercode aus der URL liest und eine Beschreibung dazu aus einer Json-Datei anzeigt. <br>
Die Seite bietet auch einen Button, mit dem man zurück zur index.html kommen soll, <br>
in der dann wieder die Übersicht angezeigt wird, sofern der Fetch, bei dem Versuch erfolgreich ist.</p>

