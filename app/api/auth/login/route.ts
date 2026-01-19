export async function POST(request: Request){
    
    const result = {};

    return new Response( JSON.stringify(result), {
        status: 200,
        headers: {'Content-Type': 'appication/json'}
    });
}