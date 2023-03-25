import './App.css';
import axios from 'axios';
import JsCookie from 'js-cookie';
import { JSEncrypt } from "jsencrypt";

function App() {
    const host = 'http://localhost:8030/api'
    let username = '';
    const axiosInstance = axios.create({
        withCredentials: true,
        baseURL: host,
        credentials: 'include',
    })
    
    function changeUsername(e)
    {
        username = e.target.value;
    }
    
    function ping(e)
    {
        axiosInstance.post('/auth/ping')
        .then(function (response) {
            console.log(response);
            let data = response.data.data;
            localStorage.setItem('serverSessionKey', data.fingerprint);
            localStorage.setItem('serverPublicKey', data.publicKey);
        }).catch(function (response) {
            showError(response);
            console.log(response);
        });
    }
    
    function createKey(e)
    {
        axiosInstance.post('/auth/create-session', {
            sessionKey: localStorage.getItem('serverSessionKey'),
            publicKey: localStorage.getItem('serverPublicKey'),
        })
        .then(function (response) {
            // do noting
        }).catch(function (response) {
            showError(response);
            console.log(response);
        });
    }
    
    function generateSecret(e)
    {
        axiosInstance.post('/auth/generate-secret', {
            sessionKey: localStorage.getItem('serverSessionKey'),
            publicKey: localStorage.getItem('clientPublicKey'),
            username: username
        }).then(function (response) {
            console.log(response);
            let data = response.data.data;
            localStorage.setItem('encodedSecret', data.secret);
            localStorage.setItem('decodedDigit', data.digit); //@todo drop when decode will be done
        }).catch(function (response) {
            showError(response);
            console.log(response);
        });
    }
    
    function decodeSecret()
    {
        let encodedSecret = localStorage.getItem('encodedSecret');
        let decodedSecret = atob(encodedSecret);
        console.log(decodedSecret);
        let clientPrivateKey = localStorage.getItem('clientPrivateKey');
        
        let decrypt = new JSEncrypt({
            default_key_size: 2048,
            log: true,
            default_public_exponent: '10000000000000001'
        });
        decrypt.setPrivateKey(clientPrivateKey);
        let decryptedValue = decrypt.decrypt(decodedSecret);
        
        console.log(decryptedValue);
        return decryptedValue;
    }
    
    function signIn(e)
    {
        // let secretDecoded = decodeSecret();
        let secretDecoded = localStorage.getItem('decodedDigit');
    
        axiosInstance.post('/auth/sign-in', {
            sessionKey: localStorage.getItem('serverSessionKey'),
            publicKey: localStorage.getItem('clientPublicKey'),
            username: username,
            digit: secretDecoded
        })
        .then(function (response) {
            console.log(response);
            let data = response.data.data;
            JsCookie.set('auth', data.authToken);
            JsCookie.set('sessionKey', data.sessionToken);
        }).catch(function (response) {
            showError(response);
            console.log(response);
        });
    }
    
    function testSomeAuthMethod(e)
    {
        axiosInstance.get('/user/me')
        .then(function (response) {
            console.log(response);
        }).catch(function (response) {
            showError(response);
            console.log(response);
        });
    }
    
    function showError(response)
    {
        let responseData = response.response;
        alert(responseData.data.data.message + '. Code: ' + responseData.status);
    }
    
    function readPublicKey(input)
    {
        let reader = new FileReader();
        reader.readAsText(input.target.files[0]);
        reader.onload = function() {
            console.log(reader.result);
            localStorage.setItem('clientPublicKey', reader.result);
        }
    }
    
    function readPrivateKey(input)
    {
        let reader = new FileReader();
        reader.readAsText(input.target.files[0]);
        reader.onload = function() {
            console.log(reader.result);
            localStorage.setItem('clientPrivateKey', reader.result);
        }
    }
    
    return (
        <div className="App">
            <div>
                <label htmlFor="username">Username</label>
                <input type="text" id="username" onBlur={changeUsername}/> <br />
            </div>
            <div>
                <label htmlFor="username">Public</label>
                <input id="publicKey" type="file" onChange={readPublicKey}/> <br/>
                <label htmlFor="username">private</label>
                <input id="privateKey" type="file" onChange={readPrivateKey} />
            </div>
            
            <button id="bnt1" onClick={ping}>Ping</button>
            <button id="bnt2" onClick={createKey}>Create key</button>
            <button id="bnt3" onClick={generateSecret}>Generate Secret</button>
            <button id="bnt4" onClick={signIn}>Sign In</button>
            <button id="bnt5" onClick={testSomeAuthMethod}>Get Profile</button>
        </div>
    );
}

export default App;
