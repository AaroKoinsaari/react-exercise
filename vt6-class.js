"use strict";
/* globals ReactDOM: false */
/* globals React: false */
/* globals data: false */

class App extends React.PureComponent {
    constructor(props) {
      super(props);
        // Käytetään lähes samaa dataa kuin viikkotehtävässä 1
        // Alustetaan tämän komponentin tilaksi data.
        // Tee tehtävässä vaaditut lisäykset ja muutokset tämän komponentin tilaan
        // päivitettäessä React-komponentin tilaa on aina vanha tila kopioitava uudeksi
        // kopioimista varten on annettu valmis mallifunktio kopioi_kilpailu
        // huom. kaikissa tilanteissa ei kannata kopioida koko dataa
	this.state = {"kilpailu": kopioi_kilpailu(data) };
        data = undefined; // tyhjätään data, että sitä ei vahingossa käytetä
        console.log( this.state.kilpailu );
        return;
    }

    render () {
      // jshint ei ymmärrä jsx-syntaksia
      /* jshint ignore:start */
      return <div>
	<LisaaJoukkue />
	<ListaaJoukkueet />
        </div>;
      /* jshint ignore:end */
    }
}

class LisaaJoukkue extends React.PureComponent {
    constructor(props) {
      super(props);
    }
    render () {
      /* jshint ignore:start */
      return <form>
        </form>;
      /* jshint ignore:end */
    }
}

class ListaaJoukkueet extends React.PureComponent {
    constructor(props) {
      super(props);
    }
    render () {
      /* jshint ignore:start */
      return <table>
        </table>;
      /* jshint ignore:end */
    }
}


ReactDOM.render(
      /* jshint ignore:start */
    <App />,
      /* jshint ignore:end */
  document.getElementById('root')

);



// datarakenteen kopioiminen
// joukkueen leimausten rasti on viite rastitaulukon rasteihin
// joukkueen sarja on viite sarjataulukon sarjaan
function kopioi_kilpailu(data) {
        let kilpailu = {};
        kilpailu.nimi = data.nimi;
        kilpailu.loppuaika = data.loppuaika;
        kilpailu.alkuaika = data.alkuaika;
        kilpailu.kesto = data.kesto;
        kilpailu.leimaustavat = Array.from( data.leimaustavat );
        let uudet_rastit = new Map(); // tehdään uusille rasteille jemma, josta niiden viitteet on helppo kopioida
        function kopioi_rastit(j) {
            	        let uusir = {};
            	        uusir.id = j.id;
            	        uusir.koodi = j.koodi;
            	        uusir.lat = j.lat;
            	        uusir.lon = j.lon;
 			uudet_rastit.set(j, uusir); // käytetään vanhaa rastia avaimena ja laitetaan uusi rasti jemmaan
            	        return uusir; 
        }
        kilpailu.rastit = Array.from( data.rastit, kopioi_rastit );
        let uudet_sarjat = new Map(); // tehdään uusille sarjoille jemma, josta niiden viitteet on helppo kopioida
        function kopioi_sarjat(j) {
            	        let uusir = {};
            	        uusir.id = j.id;
            	        uusir.nimi = j.nimi;
            	        uusir.kesto = j.kesto;
            	        uusir.loppuaika = j.loppuaika;
            	        uusir.alkuaika = j.alkuaika;
 			uudet_sarjat.set(j, uusir); // käytetään vanhaa rastia avaimena ja laitetaan uusi rasti jemmaan
            	        return uusir; 
        }
        kilpailu.sarjat = Array.from( data.sarjat, kopioi_sarjat );
        function kopioi_joukkue(j) {
                    let uusij = {};
                    uusij.nimi = j.nimi;
                    uusij.id = j.id;
            	    uusij.sarja = uudet_sarjat.get(j.sarja);

                    uusij["jasenet"] = Array.from( j["jasenet"] );
	            function kopioi_leimaukset(j) {
            	        let uusir = {};
            	        uusir.aika = j.aika;
            	        uusir.rasti = uudet_rastit.get(j.rasti); // haetaan vanhaa rastia vastaavan uuden rastin viite
            	        return uusir;
	            }
                    uusij["rastileimaukset"] = Array.from( j["rastileimaukset"], kopioi_leimaukset );
                    uusij["leimaustapa"] = Array.from( j["leimaustapa"] );
                    return uusij;
        }

        kilpailu.joukkueet = Array.from( data.joukkueet, kopioi_joukkue);
	return kilpailu;
}


