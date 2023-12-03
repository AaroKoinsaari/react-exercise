"use strict";
/* globals ReactDOM: false */
/* globals React: false */
/* globals data: false */
const App = function (props) {
  // Käytetään lähes samaa dataa kuin viikkotehtävässä 1
  // Alustetaan tämän komponentin tilaksi data.
  // Tee tehtävässä vaaditut lisäykset ja muutokset tämän komponentin tilaan
  // päivitettäessä React-komponentin tilaa on aina vanha tila kopioitava uudeksi
  // kopioimista varten on annettu valmis mallifunktio kopioi_kilpailu
  // huom. kaikissa tilanteissa ei kannata kopioida koko dataa
  const [state, setState] = React.useState({ "kilpailu": kopioi_kilpailu(data) });
  // data = undefined; // tyhjätään data, että sitä ei vahingossa käytetä
  console.log(state.kilpailu);

  const lisaaUusiJoukkue = (uusiJoukkue) => {
    setState(prevState => ({
      kilpailu: {
        ...prevState.kilpailu,
        joukkueet: [...prevState.kilpailu.joukkueet, uusiJoukkue]
      }
    }));
  };

  /* jshint ignore:start */
  return (
    <div>
      <h1>Lisää joukkue</h1>
      <div className="flex-container">
        <LisaaJoukkue
          leimaustavat={state.kilpailu.leimaustavat}
          sarjat={state.kilpailu.sarjat}
          jasenet={state.kilpailu.jasenet}
          joukkueet={state.kilpailu.joukkueet}
          lisaaUusiJoukkue={lisaaUusiJoukkue}
        />
        <ListaaJoukkueet
          joukkueet={state.kilpailu.joukkueet}
          leimaustavat={state.kilpailu.leimaustavat}
        />
      </div>
    </div>
  );
  /* jshint ignore:end */
};

const LisaaJoukkue = React.memo(function (props) {
  /* jshint ignore:start */
  const MAX_JASENET = 5;  // Dynaamisesti luotujen jäsenkenttien määrän säätämiseen
  const [nimi, setNimi] = React.useState('');
  const [valitutLeimaustavat, setValitutLeimaustavat] = React.useState([]);
  const [valittuSarja, setValittuSarja] = React.useState(props.sarjat[0].id); // Alustetaan ensimmäisen sarjan id
  const [jasenet, setJasenet] = React.useState(['', '']);  // Ensimmäiset kaksi tyhjää kenttää

  const nimiRef = React.useRef();
  const jasenRef = React.useRef();

  // Päivitetään jäsenen arvo tiettyyn indeksiin
  const handleJasenChange = (index, value) => {
    let updatedJasenet = jasenet.map((jasen, i) => (i === index ? value : jasen));

    // Tarkistetaan onko viimeisimmän kentän sisältö muuta kuin tyhjää tai whitespacea
    const viimeinenKenttaTaytetty = updatedJasenet[updatedJasenet.length - 1].trim() !== '';
    if (viimeinenKenttaTaytetty && updatedJasenet.length < MAX_JASENET) {
      updatedJasenet = [...updatedJasenet, ''];
    }

    setJasenet(updatedJasenet);
  };

  // Nimen muutosten käsittely
  const handleNimiChange = (event) => {
    setNimi(event.target.value);
  };

  const handleLeimaustapaChange = (event) => {
    const valittu = parseInt(event.target.value);
    setValitutLeimaustavat(prev =>
      event.target.checked ? [...prev, valittu] : prev.filter(tapa => tapa !== valittu)
    );
  };

  const handleSarjaChange = (event) => {
    setValittuSarja(parseInt(event.target.value));
  };

  // Validoi lomakkeen ja ilmoittaa virheistä, jos sellaisia on
  const validateForm = () => {
    // Tyhjennetään mahdolliset aiemmat virheilmoitukset
    if (nimiRef.current) {
      nimiRef.current.setCustomValidity("");
    }
    if (jasenRef.current) {
      jasenRef.current.setCustomValidity("");
    }

    // Tarkista joukkueen nimi
    if (!nimi.trim()) {
      nimiRef.current.setCustomValidity("Nimi ei saa olla tyhjä!");
      nimiRef.current.reportValidity();
      return false;
    }

    // Tarkista, onko samannimistä joukkuetta jo olemassa (case-insensitive)
    let nimiTrimmed = nimi.trim().toLowerCase();
    let onJoOlemassa = props.joukkueet.some(joukkue => joukkue.nimi.trim().toLowerCase() === nimiTrimmed);
    if (onJoOlemassa) {
      nimiRef.current.setCustomValidity("Samanniminen joukkue on jo olemassa!");
      nimiRef.current.reportValidity();
      return false;
    }

    // Tarkista jäsenten nimet
    const taytetytJasenet = jasenet.filter(jasen => jasen.trim());
    if (taytetytJasenet.length < 2) {
      jasenRef.current.setCustomValidity("Jäseniä on oltava vähintään kaksi!");
      jasenRef.current.reportValidity();
      return false;
    }

    return true;
  }

  // Käsittelee Tallenna-napin klikkauksen ja varmistaa, ettei lomaketta
  // lähetetä, jos tiedot eivät läpäisseet validointia
  const handleClick = (event) => {
    if (validateForm()) {
      handleSubmit(event);
    }
  }

  // Lähettää lomakkeen ja resetoi lomakkeen
  const handleSubmit = (event) => {
    event.preventDefault();

    // Etsitään valittu sarjaobjekti
    const valittuSarjaObjekti = props.sarjat.find(sarja => sarja.id === valittuSarja);

    // Lähetettävän datan kokoaminen
    const lahettavaData = {
      id: Date.now(),  // Generoidaan uniikki id
      nimi: nimi.trim(),
      leimaustavat: valitutLeimaustavat,
      jasenet: jasenet.filter(jasen => jasen.trim() !== ''),
      sarja: valittuSarjaObjekti,
      rastileimaukset: []
    };

    props.lisaaUusiJoukkue(lahettavaData);  // Lähetetään data

    // Tyhjennetään lomake
    setNimi('');
    setValitutLeimaustavat([]);
    setValittuSarja(props.sarjat[0].id);
    setJasenet(['', '']);
  };

  return (
    <form onSubmit={handleSubmit} action="https://appro.mit.jyu.fi/cgi-bin/view.cgi" method="post">
      <fieldset className="section">
        <legend>Joukkueen tiedot</legend>
        <div className="label-container">
          <label htmlFor="nimi">Nimi</label>
          <input
            ref={nimiRef}
            type="text"
            name="nimi"
            value={nimi}
            onChange={handleNimiChange}
          />
        </div>

        <div className="label-container">
          <label>Leimaustapa</label>
          <div id="leimaustavatContainer">
            {props.leimaustavat && props.leimaustavat.map((tapa, index) => (
              <label key={index}>
                {tapa}
                <input
                  type="checkbox"
                  name="leimaustapa"
                  value={index}
                  checked={valitutLeimaustavat.includes(index)}
                  onChange={handleLeimaustapaChange}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="label-container">
          <label>Sarjat</label>
          <div id="sarjatContainer">
            {props.sarjat && props.sarjat.map((sarja, index) => (
              <label key={index}>
                {sarja.nimi}
                <input
                  type="radio"
                  name="sarja"
                  value={sarja.id}
                  checked={valittuSarja === sarja.id}
                  onChange={handleSarjaChange}
                />
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="section">
        <legend>Jäsenet</legend>
        <div id="jasenetContainer">
          {jasenet.map((jasen, index) => (
            <div key={index} className="label-container">
              <label>Jäsen {index + 1}</label>
              <div className="input-container">
                <input
                  ref={index === 0 ? jasenRef : null}
                  type="text"
                  name={`jasen_${index}`}
                  className="jasen-kentta"
                  value={jasen}
                  onChange={(e) => handleJasenChange(index, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <button type="button" onClick={handleClick}>Tallenna</button>
    </form>
  );

  /* jshint ignore:end */
});


const ListaaJoukkueet = React.memo(function (props) {
  /* jshint ignore:start */
  // Järjestetään joukkueet ensisijaisesti sarjan nimen ja toissijaisesti joukkueen nimen mukaan
  const jarjestetytJoukkueet = props.joukkueet.slice().sort((a, b) => {
    const sarjaA = a.sarja.nimi.trim().toLowerCase();
    const sarjaB = b.sarja.nimi.trim().toLowerCase();
    const nimiA = a.nimi.trim().toLowerCase();
    const nimiB = b.nimi.trim().toLowerCase();

    if (sarjaA === sarjaB) {
      return nimiA.localeCompare(nimiB);
    }
    return sarjaA.localeCompare(sarjaB);
  });

  return (
    <table>
      <thead>
        <tr>
          <th>Sarja</th>
          <th>Joukkue</th>
        </tr>
      </thead>
      <tbody>
        {jarjestetytJoukkueet.map((joukkue, index) => (
          <tr key={joukkue.id}>
            <td>{joukkue.sarja.nimi}</td>
            <td>{joukkue.nimi}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  /* jshint ignore:end */
});


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  /* jshint ignore:start */
  <App />,
  /* jshint ignore:end */
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
  kilpailu.leimaustavat = Array.from(data.leimaustavat);
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
  kilpailu.rastit = Array.from(data.rastit, kopioi_rastit);
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
  kilpailu.sarjat = Array.from(data.sarjat, kopioi_sarjat);
  function kopioi_joukkue(j) {
    let uusij = {};
    uusij.nimi = j.nimi;
    uusij.id = j.id;
    uusij.sarja = uudet_sarjat.get(j.sarja);

    uusij["jasenet"] = Array.from(j["jasenet"]);
    function kopioi_leimaukset(j) {
      let uusir = {};
      uusir.aika = j.aika;
      uusir.rasti = uudet_rastit.get(j.rasti); // haetaan vanhaa rastia vastaavan uuden rastin viite
      return uusir;
    }
    uusij["rastileimaukset"] = Array.from(j["rastileimaukset"], kopioi_leimaukset);
    uusij["leimaustapa"] = Array.from(j["leimaustapa"]);
    return uusij;
  }

  kilpailu.joukkueet = Array.from(data.joukkueet, kopioi_joukkue);
  return kilpailu;
}
