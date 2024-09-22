const express = require("express");
const venom = require("venom-bot");
const axios = require('axios');


const app = express();
app.use(express.json());
const port = 8080;

venom.create({
    session: 'apizap'
})
.then((client) => start(client))
.catch((err) => {
    console.log(err);
});

const user_data = {};
const start = (client) => {
    app.post("/send-message", async (req, res) => {
        const { to, message } = req.body;
        await client.sendText(to + "@c.us", message);
        res.json("Mensagem enviada");
    });

    client.onMessage(async (message) => {
        if (message.isGroupMsg === false) {
            const chatId = message.from;
            if (!user_data[chatId]) {
                user_data[chatId] = {};
                await sendWelcome(client, message);
            } else {
                await handleUserResponse(client, message);
            }
            resetInactivityTimer(client, chatId);
        }
    });
};

const resetInactivityTimer = (client, chatId) => {
    if (user_data[chatId] && user_data[chatId].inactivityTimer) {
        clearTimeout(user_data[chatId].inactivityTimer);
    }
    if (user_data[chatId] && user_data[chatId].finalWarningTimer) {
        clearTimeout(user_data[chatId].finalWarningTimer);
    }
    if (user_data[chatId] && !user_data[chatId].attendingFinalized) {
        user_data[chatId].inactivityTimer = setTimeout(async () => {
            if (user_data[chatId]) {
                await client.sendText(chatId, "Você ainda está aí?");
                user_data[chatId].waitingForInactivityResponse = true;
                user_data[chatId].finalWarningTimer = setTimeout(async () => {
                    await client.sendText(chatId, "Atendimento finalizado por inatividade, a *CONSISTE / XTR* agradece!");
                    delete user_data[chatId];
                }, 5 * 60 * 1000); // 5 minutos
            }
        }, 10 * 60 * 1000); // 10 minutos
    }
};

const sendWelcome = async (client, message) => {
    const welcomeMessage = "Boas-vindas à *CONSISTE / XTR*, onde *'O seu sucesso, é o nosso compromisso!'* 🐙";
    const options = `
Digite a opção desejada:
*1* - Quero Assinar o *XTR*
*2* - Quero Saber Mais Sobre a *CONSISTE / XTR*
*3* - Quero Entrar em Contato com a *CONSISTE / XTR*
*4* - Quero Conhecer as redes sociais da *CONSISTE / XTR*
*5* - Quero que a *CONSISTE / XTR* entre em contato comigo
*6* - Finalizar Atendimento
    `;
    const fullMessage = welcomeMessage + "\n" + options;
    await client.sendText(message.from, fullMessage);
    
};

const sendOptions = async (client, to, text) => {
    const options = `
Digite a opção desejada:
*1* - Quero Assinar o *XTR*
*2* - Quero Saber Mais Sobre a *CONSISTE / XTR*
*3* - Quero Entrar em Contato com a *CONSISTE / XTR*
*4* - Quero Conhecer as redes sociais da *CONSISTE / XTR*
*5* - Quero que a *CONSISTE / XTR* entre em contato comigo
*6* - Finalizar Atendimento
    `;
    await client.sendText(to, text + "\n" + options);
};

const handleUserResponse = async (client, message) => {
    const userInput = message.body;
    const chatId = message.from;
//    console.log(`Mensagem recebida: ${JSON.stringify(message)}`);

//    console.log(`Recebido do usuário ${chatId}: ${userInput}`);

    if (await handleConsentFlow(client, message, userInput)) return;


    if (user_data[chatId] && user_data[chatId].waitingForInactivityResponse) {
        // Se o usuário responder após a mensagem de inatividade, redefinir o estado e enviar a mensagem de boas-vindas
        user_data[chatId].waitingForInactivityResponse = false;
        await sendOptions(client, chatId, "Olá, seja bem-vindo novamente à CONSISTE / XTR.");
        resetInactivityTimer(client, chatId);
        return;
    }

    switch (userInput) {
        case '1':
            await client.sendText(chatId, "Para assinar o *XTR*, visite: https://xtr.consiste.com.br/lp/landing/solicita-demo?MODELO=botWHATSAPP");
            await client.sendText(chatId, "*0* - Para voltar ao menu principal!");
            break;
        case '2':
            await client.sendText(chatId, "Informações sobre a *CONSISTE / XTR:*\n   *MISSÃO:* Fornecer soluções de gestão e de informação para assegurar geração de riqueza sendo o grande aliado de todos com quem nos relacionamos.\n   *VISÃO:* Ser reconhecida como a melhor fornecedora de soluções de gestão e de informação pela efetividade de ações e alianças que constrói com o mercado e com sua equipe.\n   *POLÍTICA DA QUALIDADE:* Fornecer soluções de gestão e informação implementando e mantendo um sistema de gestão da qualidade, conforme a Norma ISO 9001, que: Encante o cliente, assegurando a satisfação de suas necessidades e expectativas presentes e futuras e o atendimento a requisitos legais e regulamentares. Assegure o fornecimento de soluções tecnológicas precisas e atualizadas, com prazos e preços justos. Proporcione relações com benefícios mútuos com clientes, equipe, fornecedores e sociedade. Melhore continuamente os nossos processos, promova a satisfação dos nossos colaboradores e garanta o retorno do investimento dos acionistas.\n   O *XTR*, nossa solução, é flexível e adaptável a diversas áreas. Desde a coleta de dados até o relacionamento com clientes, promovendo uma gestão eficiente e focada em resultados tangíveis.\n   Venha conhecer a **CONSISTE / XTR** e descubra como podemos ajudar a impulsionar o seu sucesso empresarial. *Servir é nossa paixão e seu sucesso, nossa prioridade!*");
            await client.sendText(chatId, "Para saber mais sobre a *CONSISTE / XTR*, convidamos você a descobrir a ferramenta que impulsionará seus objetivos!");
            await client.sendText(chatId, "*0* - Para voltar ao menu principal!");
            break;
        case '3':
            await client.sendText(chatId, "Você pode entrar em contato com a *CONSISTE / XTR* das seguintes formas:\nFone: 7121026969 - 71981255686 \nE-mail: contato@consiste.com.br");
            await client.sendText(chatId, "*0* - Ver o menu principal!");
            break;
        case '4':
            await client.sendText(chatId, "Conheça a *CONSISTE / XTR* nas redes sociais:\n*YouTube:* www.youtube.com/@CONSISTECONSULTORIA\n*Instagram:* www.instagram.com/plataformaxtr/\n*Facebook:* www.facebook.com/CONSISTE\n*X (antigo Twitter):* x.com/CONSISTE");
            await sendOptions(client, chatId, "Escolha uma opção para continuar:");
            break;
        case '5':
            const privacyLink = "https://www.consiste.com.br/portal.nsf/artigo.xsp?area=politica+de+privacidade";
            await client.sendText(chatId, `Antes leia nossas políticas de privacidade: ${privacyLink}`);
            await client.sendText(chatId, "Agora nos diga se você leu e concorda com nossas políticas de privacidade. *Responda:* 'Concordo' para continuar.");
            user_data[chatId].expectingConsent = true;
            break;
        case '6':
            await client.sendText(chatId, "Atendimento finalizado, a *CONSISTE / XTR* agradece!");
            user_data[chatId].attendingFinalized = true;
            delete user_data[chatId];
            break;
        case '0':
            await sendOptions(client, chatId, "Escolha uma opção para continuar:");
            break;
        default:
//           console.log(`Opção inválida recebida do usuário ${chatId}: ${userInput}`);
            await handleDataCollection(client, message, userInput);
            break;
    }
};

const handleConsentFlow = async (client, message, userInput) => {
    const chatId = message.from;

    if (user_data[chatId] && user_data[chatId].expectingConsent && userInput === 'Concordo') {
        await client.sendText(chatId, "Digite seu nome:");
        user_data[chatId].expectingConsent = false;
        user_data[chatId].collectingName = true;
        return true;
    }
    return false;
};

const handleDataCollection = async (client, message, userInput) => {
    const chatId = message.from;



    if (user_data[chatId]) {
        if (user_data[chatId].collectingName) {
            const trimmedInput = userInput.trim();
            const nameParts = trimmedInput.split(' ');
            user_data[chatId].name = nameParts[0].trim();
            user_data[chatId].surname = nameParts.slice(1).join(' ').trim(); 
            await client.sendText(chatId, "Digite seu e-mail:");
            user_data[chatId].collectingName = false;
            user_data[chatId].collectingEmail = true;
        } else if (user_data[chatId].collectingEmail) {
            user_data[chatId].email = userInput;
            await client.sendText(chatId, "Digite seu telefone:\nEx: (##) ####-#####");
            user_data[chatId].collectingEmail = false;
            user_data[chatId].collectingPhone = true;
        } else if (user_data[chatId].collectingPhone) {
            user_data[chatId].phone = userInput;
            await client.sendText(chatId, "Informe o motivo do contato:");
            user_data[chatId].collectingPhone = false;
            user_data[chatId].collectingReason = true;
        } else if (user_data[chatId].collectingReason) {
            user_data[chatId].reason = userInput;
            await client.sendText(chatId, "Obrigado pela colaboração, em breve, entraremos em contato!");
            await client.sendText(chatId, "Atendimento finalizado, a *CONSISTE / XTR* agradece!");
            saveData(chatId);
            delete user_data[chatId];
        }
    }
};

const saveData = async (chatId) => {
    const userData = user_data[chatId];
    const url = "https://xtr.consiste.com.br/xtr-landing-page-api/lpapi/criaregistromkt";

    const mktData = {
        ref_instalacao: "instalacao-YhC7HIIBJeBPmWbmKc4J",
        nome: userData.name,
        email: userData.email,
        telefone: userData.phone,
        motivoContato: userData.reason
    };

    if (userData.surname) {
        mktData.sobrenome = userData.surname;
    }

    const data = new FormData();
    data.append('body', JSON.stringify({
        mkt: mktData,
        email: {
            email: "michaelshumaker@consiste.com.br",
            assunto: `Contato de ${userData.name} pelo WhatsApp`
        },
        nomeLp: "WhatsApp BOT"
    }));

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: { 
            'Content-Type': 'multipart/form-data'
        },
        data: data
    };

    try {

        const response = await axios.request(config);
        console.log(`Dados do usuário ${chatId} enviados com sucesso.`, response.data);
    } catch (error) {
        if (error.response) {
            console.error(`Erro dados do usuário ${chatId} para API:`, error.response.data);
        } else if (error.request) {
            console.error(`Nenhuma resposta ${chatId} para API:`, error.request);
        } else {
            console.error(`Erro ao configurar a requisição ${chatId} para a API:`, error.message);
        }
    }
};

app.listen(port, () => {
    console.log("Rodando na porta: " + port);
});