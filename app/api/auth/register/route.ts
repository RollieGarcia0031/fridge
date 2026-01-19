export default function POST(req: Request){

    const result = {};
    return new Response(JSON.stringify(result), {
        status: 200,
        headers: {'Content-Type': 'application/json'}
    });
}