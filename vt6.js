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

  // Lisää uuden joukkueen sovelluksen tilaan
  const lisaaUusiJoukkue = (uusiJoukkue) => {
    setState(prevState => ({
      kilpailu: {
        ...prevState.kilpailu,
        // Lisätään uusi joukkue nykyisten joukkoon
        joukkueet: [...prevState.kilpailu.joukkueet, uusiJoukkue]
      }
    }));
  };

  // Päivittää olemassa olevan joukkueen tiedot sovelluksen tilassa
  const paivitaJoukkue = (paivitettyJoukkue) => {
    setState(prevState => {
      // Luodaan uusi joukkueiden lista, jossa yhden joukkueen tiedot on päivitetty
      const uudetJoukkueet = prevState.kilpailu.joukkueet.map(joukkue => {
        // Jos löytyy päivitettävä joukkue, korvataan se uudella datalla
        if (joukkue.id === paivitettyJoukkue.id) {
          return paivitettyJoukkue;
        }
        return joukkue;
      });

      return {
        kilpailu: {
          ...prevState.kilpailu,
          joukkueet: uudetJoukkueet
        }
      };
    });
  };

  const [muokattavaJoukkue, setMuokattavaJoukkue] = React.useState(null);  // Tila muokattavalle joukkueelle

  // Asettaa valitun joukkueen muokattavaksi
  const asetaMuokattavaJoukkue = (joukkue) => {
    setMuokattavaJoukkue(joukkue);
  };

  // Päivittää yksittäisen rastin koodin sovelluksen tilassa
  const paivitaRastit = (id, uusiKoodi) => {
    setState(prevState => {
      // Kopioidaan rastit ja päivitetään muokatun rastin koodi
      const uudetRastit = prevState.kilpailu.rastit.map(rasti => {
        if (rasti.id === id) {
          return { ...rasti, koodi: uusiKoodi };
        }
        return rasti;
      });

      return {
        ...prevState,
        kilpailu: {
          ...prevState.kilpailu,
          rastit: uudetRastit
        }
      };
    });
  };

  // Päivittää yksittäisen rastin koordinaatteja ja laskee uudelleen joukkueiden matkat
  const paivitaKoordinaatit = (rastiId, uusiLat, uusiLon) => {
    setState(prevState => {
      const uusiKilpailu = kopioi_kilpailu(prevState.kilpailu);

      // Päivitetään rastin koordinaatit
      const rastiIndex = uusiKilpailu.rastit.findIndex(rasti => rasti.id === rastiId);
      if (rastiIndex !== -1) {
        uusiKilpailu.rastit[rastiIndex].lat = String(uusiLat);
        uusiKilpailu.rastit[rastiIndex].lon = String(uusiLon);
      }

      // Lasketaan joukkueiden matkat uudelleen
      const uudetJoukkueet = uusiKilpailu.joukkueet.map(joukkue => {
        const uusiMatka = laskeJoukkueenMatka(joukkue, uusiKilpailu.rastit);
        return { ...joukkue, matka: uusiMatka };
      });

      return { kilpailu: { ...uusiKilpailu, joukkueet: uudetJoukkueet } };
    });
  };

  // Laskee yksittäisen joukkueen matkan annettujen rastitietojen perusteella
  const laskeJoukkueenMatka = (joukkue, rastit) => {
    // Suodatetaan ja järjestetään joukkueen rastileimaukset
    const kelvollisetLeimaukset = joukkue.rastileimaukset.filter(leimaus =>
      leimaus.rasti && rastit.some(r => r.id === leimaus.rasti.id && r.lat && r.lon)
    ).sort((a, b) => new Date(a.aika) - new Date(b.aika));

    let matka = 0;
    for (let i = 0; i < kelvollisetLeimaukset.length - 1; i++) {
      const nykyinenRasti = rastit.find(r => r.id === kelvollisetLeimaukset[i].rasti.id);
      const seuraavaRasti = rastit.find(r => r.id === kelvollisetLeimaukset[i + 1].rasti.id);

      if (nykyinenRasti && seuraavaRasti) {
        matka += getDistanceFromLatLonInKm(
          parseFloat(nykyinenRasti.lat), parseFloat(nykyinenRasti.lon),
          parseFloat(seuraavaRasti.lat), parseFloat(seuraavaRasti.lon)
        );
      }
    }

    return matka;
  };


  // Karttakomponentti, joka luo ja näyttää kartan yksittäiselle rastille
  const RastiKartta = React.memo(({ lat, lon, rastiId, paivitaKoordinaatit }) => {
    // Luo kartan jokaiselle rastille ja asettaa sen sijainnin
    React.useEffect(() => {
      const mapId = "map-" + rastiId;  // Luo yksilöllisen kartan id:n rastin id:stä
      const map = L.map(mapId).setView([lat, lon], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Luodaan raahattava marker kartalle nykyisissä koordinateissa
      const marker = L.marker([lat, lon], { draggable: true }).addTo(map);

      // Tapahtumankäsittelijä raahaukselle
      marker.on('dragend', function (event) {
        const newCoords = event.target.getLatLng();
        paivitaKoordinaatit(rastiId, newCoords.lat, newCoords.lng);
      });

      // Siivotaan luotu kartta komponentin poistuessa
      return () => map.remove();
    }, [lat, lon, rastiId, paivitaKoordinaatit]);

    return <div id={"map-" + rastiId} className="rasti-kartta" style={{ height: '200px', width: '200px' }}></div>;
  });

  // Rastilistauskomponentti, joka vastaa rastien listauksesta ja niiden muokkaamisesta
  const RastiListaus = React.memo(({ rastit, paivitaRastit }) => {
    const [muokattavaRastiId, setMuokattavaRastiId] = React.useState(null);
    const [muokattavaKoodi, setMuokattavaKoodi] = React.useState("");
    const [aktiivinenRastiKartalle, setAktiivinenRastiKartalle] = React.useState(null);

    const rastiRef = React.useRef(null);  // Viittaa muokattavaan rastiin
    const karttaRef = React.useRef(null); // Viittaus aktiiviseen karttaan

    const suljeKartta = (event) => {
      if (karttaRef.current && !karttaRef.current.contains(event.target)) {
        setAktiivinenRastiKartalle(null); // Sulkee kartan, jos klikkaus tapahtuu kartan ulkopuolella
      }
    };

    React.useEffect(() => {
      // Lisätään tapahtumankuuntelija dokumenttiin
      document.addEventListener('mousedown', suljeKartta);

      return () => {
        // Poistetaan tapahtumankuuntelija, kun komponentti poistuu
        document.removeEventListener('mousedown', suljeKartta);
      };
    }, []);

    // Aktivoi rastin muokkaustilan
    const muokkaaRastia = (rasti) => {
      setMuokattavaRastiId(rasti.id);
      setMuokattavaKoodi(rasti.koodi);
    };

    // Tallentaa rastin koodin ja poistaa muokkaustilan
    const tallennaMuokkaus = (id) => {
      // Tarkistetaan, että alkaa numerolla
      const trimmattuKoodi = muokattavaKoodi.trim();
      if (/^\d/.test(trimmattuKoodi)) {
        paivitaRastit(id, trimmattuKoodi);

        // Poistetaan muokkaustila
        setMuokattavaRastiId(null);
        setMuokattavaKoodi("");
      } else {
        rastiRef.current.setCustomValidity("Rastikoodin tulee alkaa numerolla");
        rastiRef.current.reportValidity();
      }
    };

    // Näyttää valitun rastin kartalla
    const naytaRastiKartalla = (rasti) => {
      setAktiivinenRastiKartalle(rasti);
    };

    // Käytetään keskittämään fokus muokattavaan rastiin
    React.useEffect(() => {
      // Jos muokattava rasti on valittu ja ref on olemassa, keskitetään fokus
      if (muokattavaRastiId !== null && rastiRef.current) {
        rastiRef.current.focus();
      }
    }, [muokattavaRastiId]);

    return (
      <div className="rastit-container">
        <ul>
          {rastit.map((rasti) => (
            <li key={rasti.id}>
              {muokattavaRastiId === rasti.id ? (
                <input
                  ref={rastiRef}
                  type="text"
                  value={muokattavaKoodi}
                  onChange={(e) => setMuokattavaKoodi(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      tallennaMuokkaus(rasti.id);
                    }
                  }}
                  onBlur={() => tallennaMuokkaus(rasti.id)}
                />
              ) : (
                <span onClick={() => muokkaaRastia(rasti)}>{rasti.koodi}</span>
              )}
              {" "}
              <span onClick={() => naytaRastiKartalla(rasti)}>
                ({rasti.lat}, {rasti.lon})
              </span>
              {aktiivinenRastiKartalle && aktiivinenRastiKartalle.id === rasti.id && (
                <div ref={karttaRef}>
                  <RastiKartta lat={rasti.lat} lon={rasti.lon} rastiId={rasti.id} paivitaKoordinaatit={paivitaKoordinaatit} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
    /* jshint ignore:end */
  });

  /* jshint ignore:start */
  return (
    <div>
      <h1>Lisää joukkue</h1>
      <div className="flex-container">
        <div className="left-side">
          <LisaaJoukkue
            leimaustavat={state.kilpailu.leimaustavat}
            sarjat={state.kilpailu.sarjat}
            jasenet={state.kilpailu.jasenet}
            joukkueet={state.kilpailu.joukkueet}
            lisaaUusiJoukkue={lisaaUusiJoukkue}
            muokattavaJoukkue={muokattavaJoukkue}
            asetaMuokattavaJoukkue={asetaMuokattavaJoukkue}
            paivitaJoukkue={paivitaJoukkue}
          />
          <RastiListaus rastit={state.kilpailu.rastit} paivitaRastit={paivitaRastit} paivitaKoordinaatit={paivitaKoordinaatit} />        </div>
        <ListaaJoukkueet
          joukkueet={state.kilpailu.joukkueet}
          leimaustavat={state.kilpailu.leimaustavat}
          asetaMuokattavaJoukkue={asetaMuokattavaJoukkue}
        />
      </div>
    </div>
  );
  /* jshint ignore:end */
};

const LisaaJoukkue = React.memo(function (props) {
  /* jshint ignore:start */
  const MAX_JASENET = 5;  // Dynaamisesti luotujen jäsenkenttien määrän säätämiseen

  // Tilamuuttujat joukkueen eri tietojen tallentamiseen
  const [nimi, setNimi] = React.useState('');
  const [valitutLeimaustavat, setValitutLeimaustavat] = React.useState([]);
  const [valittuSarja, setValittuSarja] = React.useState(props.sarjat[0].id); // Alustetaan ensimmäisen sarjan id
  const [jasenet, setJasenet] = React.useState(['', '']);  // Ensimmäiset kaksi tyhjää kenttää
  const [rastileimaukset, setRastileimaukset] = React.useState([]);
  const [joukkueId, setJoukkueId] = React.useState(null);

  // Refit lomakkeen kenttien viittausta varten
  const nimiRef = React.useRef();
  const jasenRef = React.useRef();
  const leimaustavatRef = React.useRef();

  // Päivittää tilan
  React.useEffect(() => {
    if (props.muokattavaJoukkue) {
      setJoukkueId(props.muokattavaJoukkue.id);
      setNimi(props.muokattavaJoukkue.nimi);
      setValitutLeimaustavat(props.muokattavaJoukkue.leimaustapa);
      setValittuSarja(props.muokattavaJoukkue.sarja.id);
      setRastileimaukset(props.muokattavaJoukkue.rastileimaukset);

      let uudetJasenet = props.muokattavaJoukkue.jasenet.slice();
      if (uudetJasenet.length < MAX_JASENET) {
        uudetJasenet.push('');  // Lisää tyhjä jäsenkenttä, jos jäseniä on alle maksimimäärän
      }
      setJasenet(uudetJasenet);
    }
  }, [props.muokattavaJoukkue]);

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

  // Leimaustapojen käsittely
  const handleLeimaustapaChange = (event) => {
    const valittu = parseInt(event.target.value);
    setValitutLeimaustavat(prev =>
      event.target.checked ? [...prev, valittu] : prev.filter(tapa => tapa !== valittu)
    );
  };

  // Sarjojen käsittely
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
    if (leimaustavatRef.current) {
      leimaustavatRef.current.setCustomValidity("");
    }

    // Tarkista joukkueen nimi
    if (!nimi.trim()) {
      nimiRef.current.setCustomValidity("Nimi ei saa olla tyhjä!");
      nimiRef.current.reportValidity();
      return false;
    }

    // Tarkista, onko samannimistä joukkuetta jo olemassa
    let nimiTrimmed = nimi.trim().toLowerCase();
    let samanniminenJoukkue = props.joukkueet.find(joukkue => joukkue.nimi.trim().toLowerCase() === nimiTrimmed);
    if (samanniminenJoukkue && samanniminenJoukkue.id !== joukkueId) {
      nimiRef.current.setCustomValidity("Samanniminen joukkue on jo olemassa!");
      nimiRef.current.reportValidity();
      return false;
    }

    // Tarkista, että vähintään yksi leimaustapa on valittu
    if (valitutLeimaustavat.length === 0) {
      leimaustavatRef.current.setCustomValidity("Valitse vähintään yksi leimaustapa!");
      leimaustavatRef.current.reportValidity();
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
      nimi: nimi.trim(),
      id: joukkueId ? joukkueId : Date.now(),  // Käytetään olemassa olevaa id:tä jos muokataan joukkuetta
      leimaustapa: valitutLeimaustavat,
      jasenet: jasenet.filter(jasen => jasen.trim() !== ''),
      sarja: valittuSarjaObjekti,
      rastileimaukset: rastileimaukset
    };

    if (joukkueId) {
      props.paivitaJoukkue(lahettavaData);
    } else {
      props.lisaaUusiJoukkue(lahettavaData);
    }

    // Tyhjennetään lomake ja nollataan tilamuuttujat
    setNimi('');
    setValitutLeimaustavat([]);
    setValittuSarja(props.sarjat[0].id);
    setJasenet(['', '']);
    setRastileimaukset([]);
    setJoukkueId(null);
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
                  ref={index === 0 ? leimaustavatRef : null}
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

    return sarjaA === sarjaB ? nimiA.localeCompare(nimiB) : sarjaA.localeCompare(sarjaB);
  });

  const lataaJoukkueenTiedot = (joukkue) => {
    props.asetaMuokattavaJoukkue(joukkue);
  }

  // Komponentti joukkueen tiedoista
  const JoukkueenTiedot = ({ joukkue }) => {
    return (
      <tr>
        <td>{joukkue.sarja.nimi}</td>
        <td>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              lataaJoukkueenTiedot(joukkue);
            }}
          >
            {joukkue.nimi}
          </a>{" "}
          ({leimaustapojenNimet(joukkue.leimaustapa)})
        </td>
        <td>
          <JoukkueenJasenet jasenet={joukkue.jasenet} />
        </td>
        <td>
          <JoukkueenMatka rastileimaukset={joukkue.rastileimaukset} />
        </td>
      </tr>
    );
  };

  // Muunnetaan leimaustapojen indeksit niiden nimiksi ja liitetään ne yhteen
  const leimaustapojenNimet = (leimaustapa) => {
    return leimaustapa.map(index => props.leimaustavat[index]).sort().join(', ');
  };

  // Komponentti joukkueen jäsenistä
  const JoukkueenJasenet = ({ jasenet }) => {
    return (
      <ul>
        {jasenet.map((jasen, index) => (
          <li key={index}>{jasen}</li>
        ))}
      </ul>
    );
  };

  // Komponentti joukkueen kulkemalle matkalle
  const JoukkueenMatka = React.memo(({ rastileimaukset }) => {
    // Suodatetaan pois rastileimaukset, joilla ei ole kelvollisia sijaintitietoja
    const kelvollisetLeimaukset = rastileimaukset.filter(leimaus =>
      leimaus.rasti && leimaus.rasti.lat && leimaus.rasti.lon
    );

    // Järjestetään kelvolliset rastileimaukset ajan perusteella
    const jarjestetytLeimaukset = kelvollisetLeimaukset.sort((a, b) => new Date(a.aika) - new Date(b.aika));

    // Etsitään viimeisen 'LAHTO' ja ensimmäisen 'MAALI' rastileimauksen indeksit
    const lahtoIndex = jarjestetytLeimaukset.map(leimaus => leimaus.rasti.koodi).lastIndexOf('LAHTO');
    const maaliIndex = jarjestetytLeimaukset.map(leimaus => leimaus.rasti.koodi).indexOf('MAALI');

    if (lahtoIndex === -1 || maaliIndex === -1 || lahtoIndex >= maaliIndex) {
      return <span>0 km</span>;
    }

    // Lasketaan matka lähtö- ja maalirastin välillä
    let matka = 0;
    for (let i = lahtoIndex; i < maaliIndex; i++) {
      const nykyinenRasti = jarjestetytLeimaukset[i].rasti;
      const seuraavaLeimaus = jarjestetytLeimaukset[i + 1];
      const seuraavaRasti = seuraavaLeimaus ? seuraavaLeimaus.rasti : null;

      if (nykyinenRasti && seuraavaRasti) {
        matka += getDistanceFromLatLonInKm(
          parseFloat(nykyinenRasti.lat), parseFloat(nykyinenRasti.lon),
          parseFloat(seuraavaRasti.lat), parseFloat(seuraavaRasti.lon)
        );
      }
    }

    return <span>{matka.toFixed(2)} km</span>;
  });

  return (
    <table>
      <thead>
        <tr>
          <th>Sarja</th>
          <th>Joukkue</th>
          <th>Jäsenet</th>
          <th>Matka</th>
        </tr>
      </thead>
      <tbody>
        {jarjestetytJoukkueet.map(joukkue => (
          <JoukkueenTiedot key={joukkue.id} joukkue={joukkue} />
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


/**
* Laskee kahden pisteen välisen etäisyyden
*/
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  let R = 6371; // Radius of the earth in km
  let dLat = deg2rad(lat2 - lat1);  // deg2rad below
  let dLon = deg2rad(lon2 - lon1);
  let a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c; // Distance in km
  return d;
}
/**
   Muuntaa asteet radiaaneiksi
  */
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

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
