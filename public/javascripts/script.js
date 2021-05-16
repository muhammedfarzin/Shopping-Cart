function addToCart(proId,userId) {
    $.ajax({
        url: '/add-to-cart/' + proId,
        method: 'get',
        success: (response) => {

            if (response.status) {
                let count = $("#cart-count").html()
                count = parseInt(count) + 1
                console.log(count);
                $("#cart-count").html(count)
            }
        }
    })
}

function changeQuantity(cartId, proId, userId, count) {
    $.ajax({
        url: '/change-product-quantity',
        data: {
            cart: cartId,
            user: userId,
            product: proId,
            count: count
        },
        method: 'post',
        success: (response) => {
            if (response.status) {
                $("#" + response.proId).html(response.count)
                if (response.count === 1) {
                    $("#" + response.proId + "MinusQuantityButton").prop('disabled', true);
                    $("#" + response.proId + "MinusQuantityButton").css({ 'background': 'none', 'background-color': '#a3cbdb', 'border-left': 'none', 'border-top': 'none' })
                } else {
                    $("#" + response.proId + "MinusQuantityButton").prop('disabled', false);
                    $("#" + response.proId + "MinusQuantityButton").css({ 'background': 'none', 'background-color': 'rgb(62, 132, 160)', 'border-left': 'none', 'border-top': 'none' })
                }
                document.getElementById('total').innerHTML = response.total
            }
        }
    })
}

$("#checkout-form").submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/place-order',
        method: 'post',
        data: $('#checkout-form').serialize(),
        success: (response) => {
            if (response.codSuccess) {
                location.href = '/order-success'
            } else {
                razorpayPayment(response)
            }
        }
    })

    function razorpayPayment(order) {
        var options = {
            "key": "rzp_test_FeUTYV5p0xgxmK", // Enter the Key ID generated from the Dashboard
            "amount": order.amount + ".00", // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
            "currency": "INR",
            "name": "FIFAS",
            "description": "Test Transaction",
            "image": "https://example.com/your_logo",
            "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
            "handler": function (response) {
                verifyPayment(response, order)
            },
            "prefill": {
                "name": "Gaurav Kumar",
                "email": "gaurav.kumar@example.com",
                "contact": "9999999999"
            },
            "notes": {
                "address": "Razorpay Corporate Office"
            },
            "theme": {
                "color": "#3399cc"
            }
        };
        var rzp1 = new Razorpay(options);
        rzp1.open();
    }
    function verifyPayment(payment, order) {
        $.ajax({
            url: '/verify-payment',
            data: {
                payment,
                order
            },
            method: 'post',
            success: (response) => {
                if (response.status) {
                    location.href = '/order-success'
                } else {
                    alert('Payment Failed')
                }
            }
        })
    }
})

$(document).ready( function () {
    $('#productsTable').DataTable();
} );

function deleteCartProduct(cartId,proId) {
    $.ajax({
        url:'/delete-cart-product',
        data:{
            cartId,
            proId
        },
        method:'post',
        success:(response)=>{
            j
        }
    })
}