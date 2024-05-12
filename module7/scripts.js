const cardNumberInput = document.getElementById('card-number');
const expiryDateInput = document.getElementById('expiry-date');
const cvvInput = document.getElementById('cvv');
const emailInput = document.getElementById('email');
const payButton = document.getElementById('pay-button');
const errorMessage = document.getElementById('error-message');
const paymentSystemImage = document.getElementById('payment-system-image');

cardNumberInput.addEventListener('input', formatAndValidateCardNumber);
expiryDateInput.addEventListener('input', validateExpiryDate);
cvvInput.addEventListener('input', validateCvv);
emailInput.addEventListener('input', validateEmail);

expiryDateInput.addEventListener('input', function(event) {
    const input = event.target;
    const value = input.value.replace(/\D/g, ''); 
    const month = value.slice(0, 2);
    const year = value.slice(2, 4);

    if (value.length > 2) {
        input.value = `${month}/${year}`;
    }
});

payButton.addEventListener('click', function() {
    const cardNumber = cardNumberInput.value.replace(/\D/g, '');
    const expiryDate = expiryDateInput.value;
    const cvc = cvcInput.value;
    const email = emailInput.value;

    const isCardNumberValid = /^(\d{4}\s?){4}$/.test(cardNumber);
    const isExpiryDateValid = /^\d{2}\/\d{2}$/.test(expiryDate); 
    const isCvcValid = /^\d{3}$/.test(cvc); 
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isCardNumberValid || !isExpiryDateValid || !isCvcValid || !isEmailValid) {
        errorMessage.style.display = 'block';
    } else {
        errorMessage.style.display = 'none';
        // Здесь можно добавить код для обработки оплаты
    }
});



cardNumberInput.addEventListener('input', function(event) {
    const cardNumber = event.target.value.replace(/\D/g, ''); 

    let paymentSystem = '';
    if (cardNumber.length >= 2 && cardNumber.slice(0, 2) === '22') {
        paymentSystem = 'mir';
    } else if (cardNumber.length >= 1) {
        const firstDigit = cardNumber.charAt(0);
        switch (firstDigit) {
            case '4':
                paymentSystem = 'visa';
                break;
            case '5':
                paymentSystem = 'mastercard';
                break;
            case '6':
                paymentSystem = 'unionpay';
                break;
            default:
                paymentSystem = 'default';
                break;
        }
    }

    const imagePath = paymentSystem ? `images/${paymentSystem}.png` : '';
    paymentSystemImage.src = imagePath;
});


function formatAndValidateCardNumber(event) {
    let cardNumber = event.target.value.replace(/\D/g, ''); 
    cardNumber = cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
    cardNumberInput.value = cardNumber.trim().slice(0, 19);

    if (/[^0-9 ]/.test(cardNumber)) {
        event.target.setCustomValidity('Номер карты может содержать только цифры');
    } else {
        event.target.setCustomValidity('');
    }

    togglePayButton();
}

function validateExpiryDate(event) {
    const expiryDate = event.target.value;
    const [month, year] = expiryDate.split('/');
    const currentYear = new Date().getFullYear() % 100; 
    const currentMonth = new Date().getMonth() + 1; 
    
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        event.target.setCustomValidity('Дата окончания должна быть в формате ММ/ГГ');
    } else if (+month < 1 || +month > 12 || +year < currentYear || (+year === currentYear && +month < currentMonth)) {
        event.target.setCustomValidity('Некорректная дата окончания');
    } else {
        event.target.setCustomValidity('');
    }

    togglePayButton();
}

function validateCvv(event) {
    const cvv = event.target.value;
    if (!/^\d{3}$/.test(cvv)) {
        event.target.setCustomValidity('CVC/CVV должен содержать ровно 3 цифры');
    } else {
        event.target.setCustomValidity('');
    }

    togglePayButton();
}

function validateEmail(event) {
    const email = event.target.value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        event.target.setCustomValidity('Введите корректный email');
    } else {
        event.target.setCustomValidity('');
    }

    togglePayButton();
}

function togglePayButton() {
    const form = document.getElementById('payment-form');
    if (form.checkValidity()) {
        payButton.removeAttribute('disabled');
    } else {
        payButton.setAttribute('disabled', true);
    }
}
