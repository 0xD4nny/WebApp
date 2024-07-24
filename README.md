<h1>Web App Übungsaufgabe</h1>

<h3><u>Einleitung</u></h3>
<p>Im Rahmen meiner Ausbildung zum Fachinformatiker für Anwendungsentwicklung, habe ich die Aufgabe erhalten, eine Webseite zu entwickeln, die unsere API (SCTX) bedient. <br>
Diese Übungsaufgabe dient dazu, mein Wissen und meine Fähigkeiten im Umgang mit Webtechnologien zu vertiefen.</p>

<h3><u>Projektbeschreibung</u></h3>
<p>Die Webseite ermöglicht es dem Benutzer, gezielt und einfach Daten der API abzufragen.
Ich habe mich für eine Kachelansicht entschieden, in der sich jeder Benutzer, einfach zurechtfinden sollte.
In der obersten Kachel befindet sich eine Übersicht der Systemdaten, welche die API eingesammelt hat und zurückgibt. Zum ein- und ausklappen, kann der Toggle-Button genutzt werden.
Des Weiteren, werden Pro angeschlossenem Monitor des Systems, generisch Kacheln erzeugt, welche ein Bild des jeweiligen Monitors als Vorschau in sich hält.
Dadurch kann der Benutzer sich den gewünschten Stream auswählen und landet per Klick auf die Kachel im richtigen Stream.
Der Stream wird im Vollbild-Modus angezeigt, und durch einen Klick auf den Stream, landet der Benutzer wieder in der Übersicht und der Vollbild-Modus wird beendet.
</p>

<h3><u>Technologien</u></h3>
<ul>
<li><b>SCTX</b> ist eine integrierte Web-Anwendung, die Daten über das FastCGI-Protokoll bereitstellt. 
Die API sendet verschiedene Events mit Parametern, die von unserer Anwendung verarbeitet werden müssen.</li>
<li><b>HTML, CSS, JavaScript</b>, ohne zusätzliche Frameworks oder Bibliotheken.</li>
<li><b>Nginx</b> (Webserver)</li>
</ul>

<h3><u>Aufgabenstellung</u></h3>
<ul>
<li>Wenn die Webseite unter 127.0.0.1 aufgerufen wird, soll eine Übersichtsseite erscheinen, welche Systemdaten und eine kleine Stream-Vorschau für jeden Monitor darstellt.</li>
<li>Man soll durch die Übersichts-Seite einen Stream wählen können und dann automatisch in den Fullscreen wechseln, in dem dann der Stream angezeigt wird.</li>
<li>Systemdaten wie RAM kommen in Bytes von der API und müssen entsprechend auf eine sinnvolle Einheit umgerechnet werden, der entsprechende Postfix soll hinzugefügt werden.</li>
<li>Sollte die API einen 410 Error zurückgeben, muss die Übersichtsseite gelöscht und der Fehler entsprechend anzeigezeigt werden.</li>
</ul>

<h3><u>API-Aufrufe</u></h3>
<p>Wir haben mehre Möglichkeiten, Daten von der API abzufragen:</p>

```javascript
fetch('/api/init.sctx');
```
<p>Liefert einen Session-Key und alles was api/overview.sctx liefert.</p>

```javascript
fetch('/api/overview.sctx', { method: 'POST', body: `session=${session}` });
```

<p> Liefert Systemdaten wie, Memory, Processor, Display, etc. und ein Array mit den Stream-Preview.</p>

```javascript
fetch('/api/select.sctx', { method: 'POST', body: `session=${session}&stream=${(streamNumber)}`});
```

<p>Wählt einen Stream aus und gibt einen Status zurück, sollte dieser 200 sein, können wir den Eventhandler binden.</p>

```javascript
fetch('/api/event.sctx', { method: 'POST', body: `session=${session}` });
```

<p>Liefert die folgenden Events, mit den ensprechenden Paramentern.

<h3><u>Events</u></h3>
<ul>
<li><b>geometry:</b> Der Stream hat die Geometrie geändert. Möglicherweise hat sich die Auflösung oder sogar das Seitenverhältnis des Streams geändert. Die Folge ist, dass die Stream-Ansicht dahingehend angepasst werden muss. Das vom Stream gezeigte Bild ist komplett schwarz nach diesem Befehl und das Overlay-Bild ist gelöscht und deaktiviert.</li>
<li><b>image:</b> Ein Ausschnitt oder das komplette Bild des Streams hat sich verändert. Es wird ein Link zu einem PNG-Bild übermittelt, incl. X- und Y-Koordinaten und Höhe und Weite.
Dieses Bild muss heruntergeladen und an der entsprechenden Stelle eingezeichnet werden.</li>
<li><b>overlay:</b> Das Overlay-Bild wird sichtbar oder unsichtbar geschaltet.</li>
<li><b>overlayImage:</b> Das Overlay-Bild wird upgedated. Das Overlay-Bild ist ein 68x68px JPEG und muss immer über das Bild des Streams geblendet werden und darf somit nicht überzeichnet werden.</li>
<li><b>overlayPosition:</b> Richtet die Overlay-Position ein. An den übermittelten Koordinaten muss sich nach dem Aufruf die Koordinate X=32/Y=32 des Overlay-Bildes befinden. Mit diesem Aufruf muss das Overlay-Bild also verschoben werden. Ist das Overlay-Bild unsichtbar, so muss es, nachdem es sichtbar geschaltet wird trotzdem an der zuletzt übermittelten Stelle angezeigt werden.</li>
<li><b>terminated:</b> Der Stream wurde beendet. Das muss entsprechend angezeigt werden und der Event-Handler sollte nicht mehr benutzt werden.</li>
</ul>
<p>event kann mehrere Events auf einmal übermitteln. Links, die event zur Verfügung stellt sind mindestens 5 Sekunden lang' gültig und resultieren danach in einem 404-Fehler.</p>

<h3><u>Implementierung der Übersicht</u></h3>
<p>Wie bereits erwähnt und im Beispielbild zu erkennen ist, habe ich mich für eine Kachelansicht entschieden. Die statische Kachel enthält HTML-Tabellen, die dieselbe Anordnung wie die dynamischen Kacheln haben. Dies sorgt für eine ästhetische und Symmetrische Darstellung, besonders wenn die Anzahl der Kacheln ein gleichmäßiges Grid ergibt, wie im Beispiel: 8 Tabellen in zwei Reihen zu je 4 Tabellen.</p>
 <b>Statische Kachel:</b> Stellt die Systemdaten dar. Diese wird einmalig erstellt.<br>
<b>Dynamische Kachel:</b> Für jeden Monitor wird eine dynamische Kachel erstellt, die alle 5 Sekunden per Intervall aktualisiert wird.<br>

![readme](https://github.com/user-attachments/assets/51cf1e1c-3f9a-4b80-82e5-46ebe2157d99)

<h3><u>Implementierung des Streams</u></h3>
<p>Beim Klick auf eine dynamische Kachel, wird die Übersicht ausgeblendet und der Vollbildmodus aktiviert. Zur Anzeige des Streams nutzen wir 3 Canvas-Elemente.</p>
<ul>
<li>Overlay-Canvas: Zeigt den Mauszeiger an, damit dieser immer oben liegt und flüssiger läuft, haben wir hier ein eigenes Canvas, nur dafür.</li>
<li>Buffer-Canvas: Damit wir nicht jedes 80x80px Image einzeln auf die Webseite gezeichnet werden muss, schreiben wir alle Image-Fragmente eines Response in einen Buffer.</li>
<li>Stream-Canvas: Nachdem wir die Image-Fragmente des Responses im Buffer-Canvas gesammelt haben, übertragen wir den gesamten Buffer in das Stream-Canvas.</li>
</ul>
<p>So können wir den gesamten Response (5-15 Image Fragmente) mit nur einem Zeichenbefehl zeichnen.</p>

<h3><u>Besondere Herausforderungen</u></h3>
<p>Eine besondere Herausforderung stellte die JSON-Struktur der API dar. Es gab keine einfache Hierarchie, sondern eine Mischung aus Objekten, Wrapper Objekten und Top-Level Key-Value-Pairs. <br>
Um dieses Problem zu lösen, entwickelte ich zwei Hilfsmethoden: Die erste erkennt Wrapper-Objekte und sammelt alle enthaltenen Objekte in einem Array, die zweite sammelt alle Top-Level KVPs. <br>
Dadurch konnte ich jede JSON (ohne Arrays) generisch in die Tabellen der statische Kachel einlesen und darstellen.</p>

<h3><u>Fehlerbehandlung</u></h3>
<p>Sollte es beim Fetch zu einem Fehler zurückkommen, wird eine spezielle Fehlerseite angezeigt, die den Fehlercode aus der URL liest und eine Beschreibung dazu aus einer Json-Datei anzeigt.<br>
Die Seite bietet auch einen Button, mit dem man zurück zur index.html kommen soll, in der dann wieder die Übersicht angezeigt wird, sofern der Fetch, bei dem Versuch erfolgreich ist.</p>
