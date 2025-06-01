import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LEVEL_DEFINITIONS, type EducationLevel } from '../lib/types';
import { ChevronRight, Brain, Zap, Users, ArrowRight } from 'lucide-react';

interface GuestLandingProps {
    onStartGuest: () => void;
    onSignUp: () => void;
}

export function GuestLanding({ onStartGuest, onSignUp }: GuestLandingProps) {
    const [selectedLevel, setSelectedLevel] = useState<EducationLevel>('elementary');

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-semibold">ELI5 Learning</h1>
                    </div>
                    <Button variant="outline" onClick={onSignUp}>
                        Sign Up
                    </Button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-16">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                        Explain Like I'm 5
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                        Get any topic explained at exactly the right level for you.
                        From preschool simplicity to PhD complexity.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                        <Button
                            size="lg"
                            onClick={onStartGuest}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
                        >
                            Try it now (No signup needed)
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={onSignUp}
                            className="border-gray-300 px-8 py-3"
                        >
                            Sign up for full features
                        </Button>
                    </div>

                    {/* Live Example */}
                    <Card className="max-w-2xl mx-auto mb-16 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                See it in action
                            </CardTitle>
                            <CardDescription>
                                Try different explanation levels for "How does the internet work?"
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {Object.entries(LEVEL_DEFINITIONS).map(([level, def]) => (
                                    <Button
                                        key={level}
                                        variant={selectedLevel === level ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedLevel(level as EducationLevel)}
                                        className="text-xs"
                                    >
                                        {def.label}
                                    </Button>
                                ))}
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg text-left">
                                <Badge className={LEVEL_DEFINITIONS[selectedLevel].color}>
                                    {LEVEL_DEFINITIONS[selectedLevel].label} ({LEVEL_DEFINITIONS[selectedLevel].ageRange})
                                </Badge>
                                <p className="mt-2 text-sm text-gray-700">
                                    {getExampleExplanation(selectedLevel)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Features */}
            <section className="bg-white py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Perfect for every learning level
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        <Card>
                            <CardHeader>
                                <Brain className="w-8 h-8 text-blue-500 mb-2" />
                                <CardTitle>6 Education Levels</CardTitle>
                                <CardDescription>
                                    From preschool to PhD - get explanations that match your understanding
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(LEVEL_DEFINITIONS).map(([level, def]) => (
                                        <div key={level} className="flex items-center justify-between text-sm">
                                            <span>{def.label}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {def.ageRange}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Zap className="w-8 h-8 text-yellow-500 mb-2" />
                                <CardTitle>Instant Switching</CardTitle>
                                <CardDescription>
                                    Click any explanation to see it at a different complexity level
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        Too simple? Jump to a higher level
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Too complex? Drop down a level
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        Perfect fit? Keep exploring!
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Users className="w-8 h-8 text-green-500 mb-2" />
                                <CardTitle>Perfect For</CardTitle>
                                <CardDescription>
                                    Students, professionals, parents, and curious minds everywhere
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div>📚 Students at any level</div>
                                    <div>💼 Professionals learning new fields</div>
                                    <div>👨‍👩‍👧 Parents helping with homework</div>
                                    <div>🧠 Anyone curious about the world</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-blue-500 to-purple-600 py-16 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to start learning?</h2>
                    <p className="text-xl mb-8 opacity-90">
                        Try it now - no signup required, no credit card needed
                    </p>
                    <Button
                        size="lg"
                        onClick={onStartGuest}
                        className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3"
                    >
                        Start exploring now
                        <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </section>
        </div>
    );
}

function getExampleExplanation(level: EducationLevel): string {
    const explanations: Record<EducationLevel, string> = {
        preschool: "The internet is like a big playground where computers talk to each other! When you want to watch a video or play a game, your computer asks other computers to share it with you, just like asking a friend to share their toys.",

        elementary: "The internet is a giant network of computers all connected together around the world. When you type in a website, your computer sends a message through special cables and wireless signals to find the right computer that has what you're looking for.",

        middle: "The internet works through interconnected networks using standardized protocols. When you request a webpage, your device sends data packets through routers and servers that direct the information to its destination and back to you.",

        high: "The internet operates on a layered architecture using the TCP/IP protocol suite. Data is broken into packets, routed through multiple network nodes using dynamic routing algorithms, and reassembled at the destination using error correction and flow control mechanisms.",

        college: "The internet functions as a decentralized network of autonomous systems using BGP routing protocols. It employs a hierarchical DNS system, utilizes various transport and application layer protocols, and implements sophisticated traffic management and security measures.",

        phd: "The internet represents a complex distributed system implementing layered protocol abstractions, featuring emergent routing behaviors, scalability challenges addressed through hierarchical addressing schemes, and evolving architectural paradigms including SDN and network function virtualization."
    };

    return explanations[level];
} 